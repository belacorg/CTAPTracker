// ── State ──────────────────────────────────────────────────────────────────
let state = loadState();
let currentWeekKey = getWeekKey(new Date());
let activeTab = 'log';       // log | dashboard | schedule | history | settings
                             // Log is the landing tab: most sessions are an
                             // engineer logging a job, not reading the numbers.
let pendingJob = null;
let lastGreeting = '';
let weekSummaryKey = null;
let forecastSheetOpen = false;
let cashOutSheetOpen = false;
let cashOutMultiplier = 1.4;
let cashOutTaxRate = 'basic';
// Hours the cash-out sheet is costing. null means "whatever is payable", so
// the sheet opens on the engineer's real balance and only becomes a what-if
// once they type. Reset every time the sheet opens — a modelled figure left
// lying around would be read as a balance on the next visit.
let cashOutHours = null;
let activeDayKey = null;
let dayEditMode = false;
let activeLogDay = getTodayKey();
// The week the Log Job strip is showing. Held separately from activeLogDay so
// the engineer can step back to a finished week and look before picking a day,
// but the two must never drift apart — always go through setLogDay.
let logWeekKey = getWeekKey(new Date());
// Which of Gas / Hive / SGO / Absence is open full-screen, or null for the tiles.
let logCategory = null;
// The entry just written, so the day panel can flash it. The re-render wipes
// any class put on the tapped row, and the confirmation belongs where the
// engineer is looking for it anyway: in the list of what's on the day.
let lastLoggedTs = null;
let jobSearch = '';
let logSearchOpen = false;
// The dashboard opens on the predicted end-of-week figure, not the running
// total. Nothing in this app is a number from the business — every credit is
// the engineer's own tap scored against the catalogue — so a tab labelled
// "Actual" was claiming an authority it never had. The honest pair is what the
// week is heading for (Predicted) against what has been entered (Logged).
let ctapProjectedMode = true;
let expandedZeroWeek = null;
let weekendExpanded = false;
let openSettingsInfo = null;
// Sign of the starting balance, held separately from the value so it survives
// the number being zero or cleared. null = take it from state. iOS shows no
// minus key on a decimal keypad, so the sign has to be a control, not a keystroke.
let startBalSignNeg = null;
let legalInfoExpanded = false;
let scheduleNoteOpenDay = null;
// The day whose times are being set in the shift sheet, with the times and the
// other days to apply them to, as picked so far. Nothing is saved until Confirm.
let shiftSheet = null;   // { dk, start: 'HH:MM', end: 'HH:MM', applyTo: [dayKey] } | null
let eraseDataStep = 'idle';
let howToExpanded = false;
let graphWeekKey = getWeekKey(new Date());
let graphSelectedDay = null;
// ── Daily check-in ──
let checkinSheetOpen = false;
let checkinDayKey = null;      // the day being checked in on (always today)
let checkinDraft = null;       // { ratings: {tag: rating}, note } — uncommitted
// ── Voice logging ──
let voiceSheetOpen = false;
let voiceStatus = 'idle';      // idle | listening | parsed | typing | error
let voiceTranscript = '';
let voiceDraft = null;         // { dayKey, dayPhrase, items, unmatched }
let voiceMessage = '';
let _recognition = null;
let _voiceStartGuard = null;
let _voiceSilenceGuard = null;
let _voiceMaxTimer = null;
let _voiceCommitted = '';   // finalised phrases so far this dictation
let _voiceInterim = '';     // the phrase currently being spoken
let _voiceSeenResults = 0;  // how many results the open session has reported
let _voiceResultFloor = 0;  // results below this belong to an earlier dictation
let _voiceDeafRetries = 0;  // fresh starts made after iOS reported a deaf session
let _ctapUser = null;          // populated by __ctapInit
let _ctapDisplayName = '';     // populated by __ctapInit

// ── Job tile display metadata ───────────────────────────────────────────────
const JOB_META = {
  // Gas (core)
  asv_chb_cir_wh_swh:  { short: 'Gas Service',          sub: 'CHB, CIR, WH, SWH' },
  asv_fre:             { short: 'Gas Service',          sub: 'Gas Fire' },
  asv_hob_ckr_ovn:     { short: 'Gas Service',          sub: 'Hob, Cooker, Oven' },
  asv_bbf_wau_waw_aga: { short: 'Gas Service',          sub: 'Warm Air, Back Boiler' },
  asv_mwh_wal:         { short: 'Gas Service',          sub: 'MWH, WAL' },
  gas_repair:          { short: 'Gas Repair',           sub: 'Any appliance · contract' },
  linked_ib:           { short: 'Gas Repair',           sub: 'Fire, linked to service' },
  od_chb:              { short: 'Gas Repair',           sub: 'Non-contract · on-demand' },
  oow_chb:             { short: 'Gas Repair',           sub: 'Warranty · one-off' },
  ods_chb:             { short: 'Gas Service',          sub: 'One-off · non-contract' },
  fv_chb:              { short: 'First Visit',          sub: 'CHB' },
  fv_bbf_wau_waw:      { short: 'First Visit',          sub: 'Back Boiler' },
  ib_ff:               { short: 'First Fix',            sub: 'CHB, Back Boiler' },
  remedial_safety:     { short: 'Remedial Safety',      sub: 'First visit only' },
  ld_completed:        { short: 'Long Duration',        sub: 'CHB · completed' },
  ld_unv:              { short: 'Long Duration',        sub: 'Unvented · completed' },
  oca:                 { short: 'OCA',                  sub: 'All appliances' },
  free_gas_safety:     { short: 'Gas Safety Check',     sub: 'Free check' },
  as_inst:             { short: 'Landlords Inspection', sub: 'LGSC · gas tightness' },
  trace_repair:        { short: 'Trace & Repair',       sub: 'Variable · mins on completion' },
  // Hive
  hvi_hub:     { short: 'Hive OpenTherm',    sub: 'Upgrade · prepaid' },
  hvi_min:     { short: 'Hive Install',      sub: 'Mini thermostat' },
  hvi_wls:     { short: 'Hive Install',      sub: 'Wireless thermostat' },
  hvi_wrd:     { short: 'Hive Install',      sub: 'Wired thermostat' },
  hvi_imz:     { short: 'Hive Add Zone',     sub: 'Per extra zone' },
  hvi_trv:     { short: 'Hive Install',      sub: 'TRV · 1 action / 2 TRVs' },
  hvi_iio:     { short: 'Hive Inday Install', sub: 'Faulty controls · van stock' },
  hvu_the:     { short: 'Hive Uninstall',    sub: 'Thermostat' },
  hive_repair: { short: 'Hive Repair',       sub: 'Thermostat / TRV' },
  recall_hive: { short: 'Recall Hive',       sub: 'Thermostat / TRV' },
  inshv_min:   { short: 'Install Hive Mini', sub: 'Sold via Services' },
  inshv_thr:   { short: 'Install Hive',      sub: 'Thermostat · sold via Services' },
  inshv_trv:   { short: 'Install Hive TRVs', sub: 'Variable · sold via Services' },
  // Quotes / SGO (sales)
  standalone_quote: { short: 'Provide Quote',   sub: 'Gas · standalone' },
  him_upgrade:      { short: 'HIM Upgrade',     sub: 'Variable · quoted mins' },
  add_inhibitor:    { short: 'Add Inhibitor',   sub: 'In-day action' },
  cod_gas:          { short: 'COD / CO Detector', sub: 'In-day action' },
  hi_lead:        { short: 'HI Lead',          sub: 'Boiler lead' },
  inhibitor:      { short: 'Inhibitor',         sub: 'Fit + SGO credit' },
  hive_sale_sgo:  { short: 'Hive Sale',         sub: 'SGO credit' },
  hive_sale_fit:  { short: 'Hive Fit',          sub: 'Sale job' },
  co_alarm_sgo:   { short: 'CO Alarm Sell',     sub: 'SGO credit' },
  co_alarm_fit:   { short: 'CO Alarm Fit',      sub: 'Fit only' },
  // Absence
  wait_work:         { short: 'Wait Work',          sub: 'Variable · hours' },
  early_finish:      { short: 'Early Finish',        sub: 'NPT deduction' },
  mentor_full:       { short: 'Mentor Support',      sub: 'Full day' },
  mentor_partial:    { short: 'Mentor Support',      sub: '20% target reduction' },
  ev_charge:         { short: 'EV Charging',         sub: '' },
  buybox_collection: { short: 'Bybox Collection',    sub: 'Parts' },
  merchant_parts:    { short: 'Merchant Parts',      sub: 'Collection' },
  npt_quick:         { short: 'Non-Productive',      sub: 'Variable · minutes' },
};

// Free text going into an HTML *attribute* — the `.replace(/</g, '&lt;')` used
// for textarea bodies is not enough here, since a quote would close the
// attribute and escape into markup.
function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The engineer's first name, for the Dashboard greeting. Local-only: there is
// no account to take it from, so it is theirs to set and lives beside the other
// jcpd_* preferences. See ADR-0015.
function localDisplayName() {
  try {
    return localStorage.getItem('jcpd_name') || '';
  } catch {
    return '';
  }
}

// A job as a list row. The code (GS-CHB) is deliberately absent — it was the
// noise; the subtitle is the disambiguator, since short names alone give five
// identical "Gas Service" rows. See ADR-0008.
function jobDisplay(j) {
  const meta = JOB_META[j.id] || {};
  return {
    name: meta.short || j.name,
    sub: meta.sub || '',
    credits: j.variable ? 'Variable'
      : j.isMentorFull ? 'Full day'
      : j.isMentorPartial ? '−20% target'
      : `+${(j.minutes / 60).toFixed(2)}h`
  };
}

function buildJobRowHTML(j) {
  const d = jobDisplay(j);
  return `<button class="lj-row${j.variable ? ' variable' : ''}" data-job-id="${j.id}">
    <span class="lj-row-main"><span class="lj-row-name">${d.name}</span>${d.sub ? `<span class="lj-row-sub">${d.sub}</span>` : ''}</span>
    <span class="lj-row-credit">${d.credits}</span>
  </button>`;
}

function buildJobChipHTML(j) {
  const d = jobDisplay(j);
  return `<button class="lj-chip${j.variable ? ' variable' : ''}" data-job-id="${j.id}">
    <span class="lj-chip-name">${d.name}</span>${d.sub ? `<span class="lj-chip-sub">${d.sub}</span>` : ''}
    <span class="lj-chip-credit">${d.credits}</span>
  </button>`;
}

// ── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('error', function(e) {
  var app = document.getElementById('app');
  if (app) app.innerHTML = '<div style="padding:20px;color:#ef4444;background:#1e293b;margin:16px;border-radius:8px;font-family:monospace;font-size:12px"><b>JS Error</b><br>' + e.message + '<br>at line ' + e.lineno + '</div>';
});

// Called by src/main.js after Supabase auth + data load
window.__ctapInit = function(loadedState, profile, user) {
  _ctapUser = user;
  _ctapDisplayName = profile ? (profile.display_name || '') : '';
  if (loadedState != null) state = loadedState;
  // Apply theme/coach from profile (logged in) or localStorage (guest)
  const isLight = profile
    ? profile.theme === 'light'
    : localStorage.getItem('jcpd_theme') === 'light';
  document.body.classList.toggle('light', isLight);
  if (profile) {
    localStorage.setItem('jcpd_theme', profile.theme || 'dark');
    localStorage.setItem('jcpd_coach_mode', profile.coach_mode ? 'true' : 'false');
    // Absent on an install whose schema predates the column — default to on.
    localStorage.setItem('jcpd_checkin_on', profile.checkin_enabled === false ? 'false' : 'true');
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
  render();
};

// Called after sign-out — stay in app, re-render Settings
window.__ctapOnSignOut = function() {
  _ctapUser = null;
  _ctapDisplayName = '';
  render();
};

// Expose current state for sync layer
window.__ctapGetState = function() { return state; };

document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('jcpd_theme') === 'light') document.body.classList.add('light');
  // When Supabase is active, __ctapInit drives rendering. Skip auto-render.
  if (window.__ctapSupabaseActive) return;
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
});

// ── Render ─────────────────────────────────────────────────────────────────
// Logging a job used to skip the re-render on the Log tab, because a render
// scrolled you back to the top of the catalogue mid-tap. That left the engineer
// with a flash of colour and no way to tell whether the tap had landed, or on
// which day — the single most common thing the trial engineers reported. The
// answer is to re-render and put the scroll back, not to stay stale.
function renderKeepingScroll() {
  const y = window.scrollY;
  const main = document.querySelector('.main');
  const mainTop = main ? main.scrollTop : 0;
  render();
  const freshMain = document.querySelector('.main');
  if (freshMain) freshMain.scrollTop = mainTop;
  window.scrollTo(0, y);
}

function render() {
  try {
    document.getElementById('app').innerHTML = buildApp();
    attachListeners();
  } catch(e) {
    document.getElementById('app').innerHTML = '<div style="padding:20px;color:#ef4444;background:#1e293b;margin:16px;border-radius:8px;font-family:monospace;font-size:12px"><b>Render Error</b><br>' + e.message + '<br>' + (e.stack || '') + '</div>';
  }
}

function buildApp() {
  return `
    ${buildTopBar()}
    <main class="main" id="main">${buildMain()}</main>
    ${buildBottomNav()}
    ${buildModal()}
    ${buildWeekForecastSheet()}
    ${buildWeekSummarySheet()}
    ${buildCashOutSheet()}
    ${buildVoiceSheet()}
    ${buildCheckinSheet()}
    ${buildShiftSheet()}
    <div class="toast" id="toast"></div>
  `;
}

function buildTopBar() {
  const todayWk = getWeekKey(new Date());
  const isCurrentWeek = currentWeekKey === todayWk;
  const isFutureWeek = currentWeekKey > todayWk;
  // The mark is a C for CTAP drawn as a clock face, because the scheme pays in
  // time. Its colours come from the stylesheet, not the markup, so it cannot
  // carry a blue of its own again and light mode gets dark hands for free.
  return `
    <header class="top-bar">
      <div style="display: flex; align-items: center; gap: 10px;">
        <svg class="brand-mark" width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path class="brand-mark-c" d="M29.9 10.1 A14 14 0 1 0 29.9 29.9" stroke-width="4.2" stroke-linecap="round"/>
          <path class="brand-mark-hands" d="M20 20 V12.4 M20 20 H26.6" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="top-title">
          <div class="top-title-main">CTAP Tracker</div>
          <div class="top-title-sub">Service + Repair</div>
        </div>
      </div>
      ${activeTab === 'dashboard' ? `<div class="week-nav">
        <button id="prev-week" aria-label="Previous week">&#8249;</button>
        <span>${weekLabel(currentWeekKey)}${isCurrentWeek ? '<span class="week-dot">•</span>' : ''}${isFutureWeek ? '<span class="week-future-badge">FUTURE</span>' : ''}</span>
        <button id="next-week" aria-label="Next week" ${isCurrentWeek ? 'disabled style="opacity:0.3"' : ''}>&#8250;</button>
      </div>` : ''}
    </header>
  `;
}

function buildMain() {
  switch (activeTab) {
    case 'dashboard': return buildDashboard();
    case 'log':       return buildLogJobs();
    case 'schedule':  return buildSchedule();
    case 'history':   return buildHistory();
    case 'settings':  return buildSettings();
  }
}

function buildBottomNav() {
  const tabs = [
    { id: 'log',       label: 'Log Job',   icon: iconPlus() },
    { id: 'dashboard', label: 'Dashboard', icon: iconChart() },
    { id: 'schedule',  label: 'Schedule',  icon: iconCalendar() },
    { id: 'history',   label: 'History',   icon: iconClock() },
    { id: 'settings',  label: 'Settings',  icon: iconGear() },
  ];
  return `<nav class="bottom-nav">${tabs.map(t => `
    <button class="${t.id === activeTab ? 'active' : ''}${t.disabled ? ' nav-disabled' : ''}" data-tab="${t.id}"${t.disabled ? ' aria-disabled="true"' : ''}>
      <span class="nav-icon">${t.icon}</span><span>${t.label}</span>
    </button>`).join('')}
  </nav>`;
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function buildDashboard() {
  const week = getOrCreateWeek(state, currentWeekKey);
  const isCurrentWeek = currentWeekKey === getWeekKey(new Date());

  // ── Weekly target ──
  // The employer's bar, the same figure History and the balance use. The
  // rolling average is not a target and no longer sets one — see ADR-0022.
  const earnedHours = weekCreditHours(week);
  const targetH = weekTargetHours(state, currentWeekKey);
  const rosteredH = rosteredHours(state, week);
  // The tile used to show the figure before NPT came off, while the progress
  // bar, "still needed" and the bonus all used the figure after. An engineer
  // with 4h of NPT read "Target 32.0h", was told they needed 21.00h having
  // earned 7.00h, and could not make those add up. Show the number in use.
  const weekNptH = (week.deductionMins || 0) / 60;
  const displayTargetH = targetH;
  const weekPct = targetH > 0 ? Math.min((earnedHours / targetH) * 100, 100) : 0;
  const bonus = earnedHours >= targetH;

  // ── Today's stats ──
  const todayKey = getTodayKey();
  const dailyTargetHours = adjustedDailyTargetHours(state, week, todayKey);
  const todayJobs = (week.days || {})[todayKey] || [];
  const todayHours = todayJobs.reduce((s, j) => s + j.creditMins, 0) / 60;

  // Pace-aware colour for the current week: compare weekPct against expected
  // pace based on completed working days (days strictly before today, excluding
  // leave). Past/future weeks keep the absolute three-band thresholds since
  // pace isn't meaningful.
  let weekColour;
  if (isCurrentWeek) {
    // Working days are the whole week less leave and rest days.
    const workingDays = weekDays(currentWeekKey).filter(dk => isWorkingDay(week, dk));
    const completed = workingDays.filter(dk => dk < todayKey).length;
    const pacePct = workingDays.length > 0 ? (completed / workingDays.length) * 100 : 0;
    weekColour = weekPct >= pacePct ? 'green'
               : weekPct >= pacePct - 10 ? 'amber'
               : 'red';
  } else {
    weekColour = weekPct >= 90 ? 'green' : weekPct >= 70 ? 'amber' : 'red';
  }

  // ── Predicted end of week ──
  // The toggle used to sit on the Week tile but move only the CTAP balance
  // beside it, so tapping "Projected" left the week's own hours sitting still
  // and the control read as broken. It drives both tiles now, off the same
  // figures the Weekly Forecast sheet prints — the tile is a preview of the
  // sheet, and tapping it opens the full working.
  const pace = weekPaceFigures(currentWeekKey, week);
  // Nothing to predict from until a day has been logged, and nothing left to
  // predict once every working day is in. Both cases hide the toggle rather
  // than offer a mode that would show the same number twice.
  const weekPredictable = isCurrentWeek && pace.projected !== null && !pace.isSettled;
  const showPredicted = weekPredictable && ctapProjectedMode;
  const displayWeekH = showPredicted ? pace.projected : earnedHours;
  const displayWeekPct = targetH > 0 ? Math.min((displayWeekH / targetH) * 100, 100) : 0;
  // In predicted mode the honest question is no longer "are you keeping pace?"
  // but "does this pace land the bonus?", so colour by the gap at the finish.
  const displayWeekColour = showPredicted
    ? (pace.projGap >= 0 ? 'green' : pace.projGap >= -(targetH * 0.1) ? 'amber' : 'red')
    : weekColour;

  // ── CTAP balance ──
  const bal = cumulativeBalance(state);
  // The balance this week is heading for: what is banked from closed weeks,
  // plus the surplus or shortfall this week lands on at the current pace.
  // It used to close the week off today instead, which was defensible while
  // the tile beside it said "Actual" — but two tiles both captioned predicted
  // and disagreeing by a day's work is worse than either reading alone.
  const projectedBal = isCurrentWeek && pace.projected !== null
    ? bal + pace.projected - pace.targetHours
    : bal;
  // Tied to the same switch as the Week tile, and to the same guard: with no
  // day logged yet, "projected" would book the whole week's target as a
  // deficit and there would be no visible toggle to get back from it.
  const displayBal = showPredicted ? projectedBal : bal;
  // Zero is its own state, not the bottom of "in credit". Every engineer starts
  // the trial at 0.00 with nothing logged, and an app that opens by congratulating
  // them on a balance they have not earned reads as decoration rather than a
  // ledger. The threshold matches the two decimals the tile prints: anything that
  // displays as 0.00 is level.
  const balLevel = Math.abs(displayBal) < 0.005;
  const balColour = balLevel ? 'neutral' : displayBal > 0 ? 'green' : 'red';
  const balLabel = balLevel ? 'Level' : displayBal > 0 ? 'In credit' : 'Deficit';
  const balAbs = Math.abs(displayBal);
  const balSign = balLevel ? '' : displayBal < 0 ? '-' : '+';
  const balSignColour = displayBal < 0 ? 'red' : 'green';
  const balIntNum = Math.floor(balAbs);
  const balDecStr = (balAbs % 1).toFixed(2).slice(1);

  // ── Deductions ──
  const allDed = week.deductionLog || [];
  const allDedIndexed = allDed.map((d, i) => ({ ...d, logIdx: i }));
  const todayDeds = allDedIndexed.filter(d => d.date === todayKey);
  const todayMentor = (week.mentorDays || {})[todayKey];
  const hasAny = todayJobs.length > 0 || todayDeds.length > 0 || !!todayMentor;
  const prevDayHours = Math.max(0, earnedHours - todayHours);
  const hasPrevDayJobs = prevDayHours > 0.001;

  // ── Week bar chart ──
  // Bar height shows credits as proportion of standard daily hours — no per-day target colour
  const wDays = weekDays(currentWeekKey);
  const DAY_ABBR = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dailyRef = state.baseHours / 5;
  const weekBarsHTML = wDays.map((dk, i) => {
    const dj = (week.days || {})[dk] || [];
    const dc = dj.reduce((s, j) => s + j.creditMins, 0) / 60;
    const isToday = dk === todayKey;
    const isLeave = dayIsLeave(week, dk);
    const bp = dailyRef > 0 ? Math.min((dc / dailyRef) * 100, 100) : (dc > 0 ? 100 : 0);
    const cls = isLeave ? 'leave' : isToday ? 'today' : dc > 0 ? 'done' : 'empty';
    return `<div class="week-bar-col${isToday ? ' today' : ''}">
        <div class="week-bar-track"><div class="week-bar-fill ${cls}" style="height:${bp.toFixed(0)}%"></div></div>
        <div class="week-bar-label">${DAY_ABBR[i]}</div>
      </div>`;
  }).join('');

  // ── Performance Factor ──
  // Formula and per-day cap live in data.cjs (estimatedDailyPFMins).
  const todayPFMins = estimatedDailyPFMins(dailyRawOutputHours(state, week, todayKey));

  // ── Greeting + date header ──
  const isoWeekOf = function(dateObj) {
    const d = new Date(dateObj); d.setHours(0,0,0,0);
    const dow = d.getDay();
    d.setDate(d.getDate() + 3 - (dow + 6) % 7);
    const w1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
  };

  const greetHour = new Date().getHours();
  const _name = localDisplayName();
  const greetName = _name ? (', ' + _name.split(' ')[0]) : '';
  const greeting = (greetHour >= 5 && greetHour < 12 ? 'Good morning'
    : greetHour >= 12 && greetHour < 17 ? 'Good afternoon'
    : greetHour >= 17 && greetHour < 22 ? 'Good evening'
    : 'Good night') + greetName;
  const greetDisplay = lastGreeting === greeting ? greeting + '...' : greeting;

  let dateStr = '';
  if (isCurrentWeek) {
    const _now = new Date();
    const _dow = _now.getDay();
    const _wkDay = Math.min((((_dow + 6) % 7) + 1), 5);
    const _isoWk = isoWeekOf(_now);
    dateStr = _now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
      + ' · WK ' + _isoWk + ' · DAY ' + _wkDay + ' / 5';
  } else if (currentWeekKey < getWeekKey(new Date())) {
    const wkStart = new Date(currentWeekKey + 'T00:00:00');
    const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6);
    const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    dateStr = 'WK ' + isoWeekOf(wkStart) + ' · ' + fmt(wkStart) + ' – ' + fmt(wkEnd);
  }

  // ── Still needed + context line for hero card ──
  const stillNeeded = Math.max(0, dailyTargetHours - todayHours);
  let contextLine = '';
  if (stillNeeded === 0 && dailyTargetHours > 0) {
    contextLine = "Today's target reached.";
  } else if (stillNeeded > 0 && todayJobs.length > 0) {
    const lastJob = todayJobs[todayJobs.length - 1];
    const creditH = lastJob.creditMins / 60;
    if (creditH > 0) {
      const xMore = Math.ceil(stillNeeded / creditH);
      const lastJobMeta = JOB_META[lastJob.id] || {};
      const lastJobShort = lastJobMeta.short || lastJob.name.replace(/\s*\(.*$/, '').trim();
      contextLine = `${xMore} more ${lastJobShort} closes today's gap.`;
    }
  }


  return `
    ${isCurrentWeek ? `<div class="dash-greeting-row">
      <div class="dash-greeting" id="greeting-text" data-greeting="${greeting}"><span
        class="dash-greeting-ghost" aria-hidden="true">${greeting}...</span><span
        class="dash-greeting-live" id="greeting-live">${greetDisplay}</span></div>
      <div class="pixel-lane" id="pixel-lane" aria-hidden="true"></div>
    </div>` : ''}
    ${dateStr ? `<div class="date-header">${dateStr}</div>` : ''}
    <div class="hero-jobs-card">
      <div class="ctap-hero-label" style="margin-bottom:10px">JOB CREDITS</div>
      <div class="hero-three-row">
        <div class="hero-col">
          <div class="hero-col-label">EARNED TODAY</div>
          <div class="hero-col-num${todayHours > 0 ? ' green' : ''}">${todayHours.toFixed(2)}<span class="hero-col-unit">h</span></div>
        </div>
        <div class="hero-col">
          <div class="hero-col-label">STILL NEEDED</div>
          <div class="hero-col-num${stillNeeded > 0 ? ' amber' : ' green'}">${stillNeeded.toFixed(2)}<span class="hero-col-unit">h</span></div>
        </div>
        <div class="hero-col">
          <div class="hero-col-label">WEEK GAP</div>
          <div class="hero-col-num${Math.max(0, targetH - earnedHours) > 0 ? ' amber' : ' green'}">${Math.max(0, targetH - earnedHours).toFixed(2)}<span class="hero-col-unit">h</span></div>
        </div>
      </div>
      ${(() => {
        const dPct = dailyTargetHours > 0 ? Math.min((todayHours / dailyTargetHours) * 100, 100) : (todayHours > 0 ? 100 : 0);
        const dCol = dPct >= 100 ? 'green' : dPct >= 70 ? 'amber' : 'red';
        return `<div class="progress-bar" style="margin-bottom:6px">
          <div class="progress-bar-fill ${dCol}" style="width:${dPct.toFixed(1)}%"></div>
        </div>`;
      })()}
      ${contextLine ? `<div class="hero-context-line">${contextLine}</div>` : ''}
    </div>

    ${isCurrentWeek ? buildSetupCard() : ''}
    ${isCurrentWeek ? buildCheckinCard() : ''}
    ${isCurrentWeek ? buildDeficitClearedCard() : ''}
    ${isCurrentWeek ? buildCoachCard() : ''}

    <div class="split-cards">
      <div class="split-card" id="ctap-tile" style="cursor:pointer">
        <div class="split-card-top">
          <span class="split-card-label">CTAP</span>
          <span class="status-badge ${balColour}" style="font-size:0.55rem;padding:2px 7px">${balLabel}</span>
        </div>
        <div class="split-hours" style="color:var(--${balLevel ? 'muted' : balColour})">${balSign}${balIntNum}${balDecStr}<span class="split-unit">h</span></div>
        <div class="split-sub">${showPredicted ? 'predicted balance' : 'balance'}</div>
        ${isCurrentWeek ? `<div class="split-pace pace-muted">Starting: ${(state.startingBalance || 0) >= 0 ? '+' : ''}${(state.startingBalance || 0).toFixed(2)}h</div>` : ''}
      </div>
      <div class="split-card" id="week-tile">
        <div class="split-card-top">
          <span class="split-card-label">Week</span>
          <div style="display:flex;align-items:center;gap:6px">
            ${isCurrentWeek && weekPredictable ? `<button id="ctap-proj-toggle" class="ctap-proj-btn${ctapProjectedMode ? ' active' : ''}" aria-label="${ctapProjectedMode ? 'Showing predicted end of week. Tap to show hours logged so far.' : 'Showing hours logged so far. Tap to show predicted end of week.'}">${ctapProjectedMode ? 'Predicted' : 'Logged'}</button>` : ''}
            <span class="pct-badge pct-badge-${displayWeekColour}">${Math.round(displayWeekPct)}%</span>
          </div>
        </div>
        <div class="split-hours">${displayWeekH.toFixed(2)}<span class="split-unit">h</span></div>
        ${weekPredictable ? `<div class="split-sub">${showPredicted ? 'predicted end of week' : 'logged so far'}</div>` : ''}
        ${showPredicted ? `<div class="week-pred-basis">${pace.earnedHours.toFixed(2)}h logged over ${pace.daysWorked} day${pace.daysWorked === 1 ? '' : 's'} · ${pace.daysRemaining} to go</div>` : ''}
        <div class="week-rostered-row">Rostered ${rosteredH.toFixed(1)}h <span class="week-rostered-sep">·</span> Target ${displayTargetH.toFixed(1)}h</div>
        <div class="week-target-basis">${rosteredH.toFixed(1)}h rostered × ${Math.round((typeof state.weeklyTargetPct === 'number' ? state.weeklyTargetPct : 0.8) * 100)}%${weekNptH > 0.005 ? `, less ${weekNptH.toFixed(2)}h NPT` : ''}</div>
        <div class="week-chart">${weekBarsHTML}</div>
      </div>
    </div>

    ${isCurrentWeek ? buildBestAdviceStrip(stillNeeded, todayJobs, week, todayKey) : ''}

    <details class="insights-details"${hasAny ? ' open' : ''}>
      <summary class="insights-summary">
        <span>Today's Jobs</span>
        <span class="insights-count">${todayHours.toFixed(2)}h${hasPrevDayJobs ? ' · +' + prevDayHours.toFixed(2) + 'h earlier' : ''}</span>
      </summary>
      <div style="margin-top:6px">
        ${hasAny
          ? todayJobs.map((j, i) => {
              const ts = j.ts ? new Date(j.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
              return `<div class="job-entry">
                <span class="job-ts">${ts}</span>
                <span class="job-name">${j.name}${j.variableInput ? ` <span style="color:var(--muted)">(${j.variableInput})</span>` : ''}</span>
                <span class="job-credits">+ ${(j.creditMins / 60).toFixed(2)} h</span>
                <button class="del-btn" data-day="${todayKey}" data-idx="${i}" title="Remove">×</button>
              </div>`;
            }).join('')
            + todayDeds.map(d => `
            <div class="job-entry">
              <span class="job-ts">NPT</span>
              <span class="job-name" style="color:var(--amber)">${d.name}</span>
              <span class="job-credits" style="color:var(--amber)">-${(d.mins / 60).toFixed(2)}h</span>
              <button class="del-btn del-ded-btn" data-ded-idx="${d.logIdx}" title="Remove">×</button>
            </div>`).join('')
            + (todayMentor ? `<div class="job-entry">
              <span class="job-ts">—</span>
              <span class="job-name" style="color:var(--accent)">${todayMentor === 'full' ? 'Mentor Support (Full Day)' : 'Mentor Support (20% Reduction)'}</span>
              <span class="job-credits" style="color:var(--accent)">${todayMentor === 'full' ? 'Target 0h' : '−20%'}</span>
              <button class="del-mentor-btn" data-day="${todayKey}" title="Remove">×</button>
            </div>` : '')
          : ''
        }
        ${hasPrevDayJobs ? `
          <div style="margin-top:8px;padding-top:8px;border-top:0.5px solid var(--sep)">
            <span style="font-size:0.72rem;color:var(--muted)">+${prevDayHours.toFixed(2)}h earlier this week</span>
          </div>` : ''}
        <button id="go-log-tab-empty" class="empty-log-btn">+ Add a job</button>
      </div>
    </details>

    ${buildInsightsCard(dailyTargetHours, todayHours, targetH, earnedHours, todayPFMins)}
    ${buildCreditGraph()}
  `;
}

function buildSchedule() {
  const week = getOrCreateWeek(state, currentWeekKey);
  const shifts = week.shifts || {};
  const DAY_ABBR = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const days = weekDays(currentWeekKey);
  const todayKey = getTodayKey();
  const defaultLunch = state.defaultLunch !== undefined ? state.defaultLunch : 30;
  const lunchLabels = { 0: 'No lunch', 15: '15 min', 30: '30 min', 45: '45 min', 60: '1 hour' };

  // Always show the full week

  // "11 – 17 May" or "26 Apr – 2 May"
  function schedWeekLabel(wk) {
    const start = new Date(wk + 'T00:00:00');
    const end = new Date(start); end.setDate(start.getDate() + 6);
    const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (start.getMonth() === end.getMonth()) return `${start.getDate()} – ${endStr}`;
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${endStr}`;
  }

  function buildDayRow(dk, i) {
    const s = shifts[dk] || {};
    const hrs = shiftHours(s);
    const isLeave = !!(s.leave);
    const d = new Date(dk + 'T00:00:00');
    const dayNum = d.getDate();
    const isToday = dk === todayKey;
    const note = (s.note || '').trim();
    const hasNote = note.length > 0;
    const isNoteOpen = scheduleNoteOpenDay === dk;
    const rowHtml = `<div class="shift-row${isToday ? ' shift-today' : ''}${isLeave ? ' shift-leave' : ''}"><div class="sched-day-col${isToday ? ' is-today' : ''}"><span class="sched-day-abbr">${DAY_ABBR[i]}</span><span class="sched-day-num">${dayNum}</span></div>${isLeave ? `<div class="sched-leave-label">Annual leave</div>` : `<button type="button" class="sched-time-wrap sched-time-btn" data-action="edit-shift" data-day="${dk}" aria-label="Set ${d.toLocaleDateString('en-GB', { weekday: 'long' })}'s shift times"><span class="sched-time-val">${s.start || '--:--'}</span><span class="shift-sep">–</span><span class="sched-time-val">${s.end || '--:--'}</span></button>`}<span class="sched-hrs${isToday ? ' is-today' : ''}">${isLeave ? 'AL' : hrs !== null ? hrs.toFixed(1) + 'h' : isRestDay(week, dk) ? 'Rest' : '—'}</span><button class="al-btn${isLeave ? ' active' : ''}" data-day="${dk}" data-action="toggle-leave">${isLeave ? '✓ Leave' : 'Leave'}</button><button class="sched-note-btn${hasNote ? ' has-note' : ''}${isNoteOpen ? ' is-open' : ''}" data-day="${dk}" data-action="toggle-note" title="Day note" aria-label="Day note">${hasNote ? '●' : '+'}</button></div>`;
    const notePanel = isNoteOpen
      ? `<div class="sched-note-panel"><textarea class="sched-note-input" data-day="${dk}" rows="2" placeholder="What happened today? Stuck in traffic, customer reschedule, training…">${note.replace(/</g, '&lt;')}</textarea><p class="sched-note-hint">Saves automatically</p></div>`
      : '';
    return `<div class="shift-row-wrap">${rowHtml}${notePanel}</div>`;
  }

  const weekdayRows = days.map((dk, i) => buildDayRow(dk, i)).join('');

  const todayWk = getWeekKey(new Date());
  const isFuture = currentWeekKey > todayWk;
  const maxFutureSched = new Date(); maxFutureSched.setDate(maxFutureSched.getDate() + 56);
  const schedAtCap = currentWeekKey >= getWeekKey(maxFutureSched);

  return `
    <div class="st-section-label">WEEK SCHEDULE</div>
    <div class="sched-nav-row">
      <div class="sched-nav-week">
        <button id="sched-prev-week" class="sched-nav-btn">&#8249;</button>
        <span class="sched-nav-label">${schedWeekLabel(currentWeekKey)}</span>
        <button id="sched-next-week" class="sched-nav-btn" ${schedAtCap ? 'disabled' : ''}>&#8250;</button>
      </div>
      <button id="apply-default" class="sched-standard-btn">Standard week</button>
    </div>
    <div class="autosave-bar">
      <span id="autosave-check" class="autosave-check">✓</span>
      <span class="autosave-text">Tap a day's times to change them · Lunch deducted from daily target</span>
    </div>
    ${isFuture ? `<div style="background:rgba(255,165,36,0.08);border:1px solid rgba(255,165,36,0.2);border-radius:10px;padding:10px 14px;margin-bottom:10px;font-size:0.76rem;color:var(--accent);line-height:1.5"><strong>Future week</strong> — Set your schedule in advance.</div>` : ''}
    <div class="dashboard-card" style="padding:2px 12px">
      ${weekdayRows}
    </div>
    <div class="dashboard-card default-lunch-card">
      <div class="default-lunch-row">
        <div>
          <div class="default-lunch-title">Default lunch</div>
          <div class="default-lunch-sub">Deducted from each day's target</div>
        </div>
        <button id="default-lunch-chip" class="default-lunch-chip">${lunchLabels[defaultLunch] || '30 min'}</button>
      </div>
    </div>
  `;
}

function buildBalanceCard() {
  // kept for any future callers; dashboard now uses inline balance
  const bal = cumulativeBalance(state);
  const colour = bal >= 0 ? 'green' : 'red';
  const sign = n => (n >= 0 ? '+' : '') + n.toFixed(2);
  return `<span style="color:var(--${colour})">${sign(bal)}h</span>`;
}

function buildCreditGraph() {
  const todayKey     = getTodayKey();
  const todayWk      = getWeekKey(new Date());
  const week         = state.weeks[graphWeekKey] || { days: {} };
  const days         = weekDays(graphWeekKey);
  const DAY_ABBR     = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const isGrCurrent  = graphWeekKey === todayWk;
  const isFutureWeek = graphWeekKey > todayWk;

  const dayData = days.map(dk => {
    const jobs = (week.days || {})[dk] || [];
    return { cr: jobs.reduce((s, j) => s + j.creditMins, 0) / 60, count: jobs.length };
  });
  const dayCredits = dayData.map(d => d.cr);

  // Daily target uses the same pct factor as the dashboard
  const pctFactor = typeof state.weeklyTargetPct === 'number' ? state.weeklyTargetPct : 0.8;
  const dailyRef  = (state.baseHours / 5) * pctFactor;
  const maxCred   = Math.max(...dayCredits, dailyRef, 0.01);
  const maxY      = maxCred * 1.25;

  // SVG layout
  const W = 300, H = 110;
  const lm = 6, rm = 6, tm = 14, bm = 22;
  const cw = W - lm - rm;
  const ch = H - tm - bm;

  const xi = i => lm + (i / 6) * cw;
  const yv = v => tm + ch - (Math.min(v, maxY) / maxY) * ch;

  const targetY = yv(dailyRef).toFixed(1);

  // Only draw dots/line for days that have passed or equal today
  const visibleDots = days.map((dk, i) => {
    if (isFutureWeek) return null;
    if (isGrCurrent && dk > todayKey) return null;
    return { i, dk, cr: dayData[i].cr, count: dayData[i].count };
  }).filter(Boolean);

  const linePoints = visibleDots.map(({ i, cr }) =>
    `${xi(i).toFixed(1)},${yv(cr).toFixed(1)}`
  ).join(' ');

  // Week navigation bounds
  const prevGrDate = new Date(graphWeekKey + 'T00:00:00');
  prevGrDate.setDate(prevGrDate.getDate() - 7);
  const prevGrKey  = getWeekKey(prevGrDate);
  const nextGrDate = new Date(graphWeekKey + 'T00:00:00');
  nextGrDate.setDate(nextGrDate.getDate() + 7);
  const nextGrKey  = getWeekKey(nextGrDate);
  const canGoNext  = nextGrKey <= todayWk;
  const allWkKeys  = Object.keys(state.weeks).sort();
  const canGoPrev  = allWkKeys.length > 0 && prevGrKey >= allWkKeys[0];

  const hasData = visibleDots.some(d => d.cr > 0);

  // Clear selected day if switching weeks
  if (graphSelectedDay && !days.includes(graphSelectedDay)) graphSelectedDay = null;

  return `
    <details class="insights-details" open>
      <summary class="insights-summary">
        <span>Daily Credits</span>
        <span class="insights-count">${weekLabel(graphWeekKey)}</span>
      </summary>
      <div class="credit-graph-card" style="position:relative">
        <div class="credit-graph-nav" style="justify-content:flex-end;margin-bottom:8px">
          <button class="graph-week-btn" id="graph-prev-week" ${!canGoPrev ? 'disabled' : ''}>&#8249;</button>
          <span class="graph-week-label" style="min-width:100px;text-align:center">${weekLabel(graphWeekKey)}</span>
          <button class="graph-week-btn" id="graph-next-week" ${!canGoNext ? 'disabled' : ''}>&#8250;</button>
        </div>
        <svg viewBox="0 0 ${W} ${H}" class="credit-graph-svg" preserveAspectRatio="none">
          <line x1="${lm}" y1="${(tm + ch / 2).toFixed(0)}" x2="${W - rm}" y2="${(tm + ch / 2).toFixed(0)}" class="graph-grid-line"/>
          <line x1="${lm}" y1="${targetY}" x2="${W - rm}" y2="${targetY}" class="graph-target-line"/>
          <text x="${W - rm - 1}" y="${(parseFloat(targetY) - 2).toFixed(0)}" class="graph-target-lbl" text-anchor="end">${dailyRef.toFixed(1)}h</text>
          ${visibleDots.length >= 2 ? `<polyline points="${linePoints}" class="graph-line"/>` : ''}
          ${visibleDots.map(({ i, dk, cr, count }) => {
            const isToday = isGrCurrent && dk === todayKey;
            const isSelected = dk === graphSelectedDay;
            const aboveRef = cr >= dailyRef - 0.01;
            const dotCls = cr === 0 ? 'graph-dot graph-dot-zero' : aboveRef ? 'graph-dot graph-dot-above' : 'graph-dot';
            const r = isSelected ? '6' : isToday ? '5' : '4';
            const cx = xi(i).toFixed(1), cy = yv(cr).toFixed(1);
            return `<circle cx="${cx}" cy="${cy}" r="${r}" class="${dotCls}${isToday ? ' graph-dot-today' : ''}${isSelected ? ' graph-dot-selected' : ''}"/>
            <circle cx="${cx}" cy="${cy}" r="14" fill="transparent" class="graph-dot-hit" data-day="${dk}" data-jobs="${count}" data-credits="${cr.toFixed(2)}"/>`;
          }).join('')}
          ${days.map((dk, i) => {
            const isToday = isGrCurrent && dk === todayKey;
            return `<text x="${xi(i).toFixed(1)}" y="${H - 5}" class="graph-day-lbl${isToday ? ' graph-day-today' : ''}" text-anchor="middle">${DAY_ABBR[i]}</text>`;
          }).join('')}
        </svg>
        ${isFutureWeek ? `<p class="graph-empty-msg">Future week — no data yet</p>` : (!hasData ? `<p class="graph-empty-msg">No jobs logged this week</p>` : '')}
        <div class="graph-tooltip" id="graph-tooltip" style="display:none"></div>
      </div>
    </details>
  `;
}

function buildInsightsCard(dailyTarget, todayHours, weekTarget, weekEarned, todayPFMins) {
  // Insights are Coach speaking, so the Coach Mode toggle turns them off too.
  if (!isCoachModeOn()) return '';
  const insights = getCoachInsights(state, currentWeekKey, {
    dailyTarget: dailyTarget,
    todayHours: todayHours,
    weekTarget: weekTarget,
    weekEarned: weekEarned,
    todayPFMins: todayPFMins,
  });
  const tips = insights.slice(0, 4);
  if (tips.length === 0) {
    tips.push({ kind: 'empty', priority: 5, severity: 'green', text: 'Log some jobs to see insights here' });
  }

  return `
    <details class="insights-details">
      <summary class="insights-summary">
        <span>Insights</span>
        <span class="insights-count">${tips.length} shown</span>
      </summary>
      <div class="insights-scroll">
        ${tips.map(tip => `<div class="tip-row${tip.kind === 'pf' ? ' tip-row-pf' : ''}"><span class="tip-dot ${tip.severity}"></span><span class="tip-text">${tip.text}</span></div>`).join('')}
      </div>
    </details>`;
}
// ── Ticker Strip ───────────────────────────────────────────────────────────
function buildDayBlock(dayKey, jobs, isToday, week) {
  const total = jobs.reduce((s, j) => s + j.creditMins, 0);
  const totalHours = total / 60;
  const isLeave = dayIsLeave(week, dayKey);
  const target = getDailyTarget(state, week, dayKey);
  const dotColour = isLeave ? 'grey' : totalHours >= target ? 'green' : 'red';
  return `
    <div class="day-section${isToday ? ' open' : ''}">
      <div class="day-header">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="history-dot ${dotColour}"></span>
          <span class="day-name">${dayLabel(dayKey)}${isToday ? ' <span style="color:var(--accent);font-size:0.7rem">TODAY</span>' : ''}${isLeave ? ' <span style="color:var(--amber);font-size:0.7rem">LEAVE</span>' : ''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="day-total" style="${isLeave ? 'color:var(--amber)' : ''}">${isLeave ? 'Annual Leave' : totalHours.toFixed(2) + 'h'}</span>
          ${!isLeave ? '<span class="day-chevron">›</span>' : ''}
        </div>
      </div>
      ${!isLeave ? `<div class="day-jobs">
        ${jobs.map((j, i) => `
          <div class="job-entry">
            <span class="job-name">${j.name}${j.variableInput ? ` <span style="color:var(--muted)">(${j.variableInput})</span>` : ''}</span>
            <span class="job-credits">+ ${(j.creditMins/60).toFixed(2)} h</span>
            <button class="del-btn" data-day="${dayKey}" data-idx="${i}" title="Remove">×</button>
          </div>`).join('')}
      </div>` : ''}
    </div>
  `;
}


// Picking a day and showing its week are one act: a day off the visible week
// would leave the strip with nothing selected.
function setLogDay(key) {
  activeLogDay = key;
  logWeekKey = getWeekKey(new Date(key + 'T00:00:00'));
}

// A week at a glance, so a day you forgot to log is visible rather than
// something you step backwards to find. Monday to Sunday, matching the CTAP
// week the target is counted over — see getLogWeekStrip.
function buildLogWeekStrip() {
  const days = getLogWeekStrip(state, logWeekKey);
  const cells = days.map(d => {
    const selected = d.key === activeLogDay;
    const logged = d.count > 0;
    // A day off, a day with nothing on it and a day that hasn't happened must
    // not read the same — only one of them is a gap worth chasing.
    const mark = d.isFuture ? '' : logged ? '&#9679;' : (d.rostered ? '&#9675;' : '&#183;');
    const cls = ['lj-strip-day',
      selected ? 'selected' : '',
      d.isToday ? 'today' : '',
      logged ? 'logged' : '',
      d.isFuture ? 'future' : '',
      d.rostered ? '' : 'off'].filter(Boolean).join(' ');
    const aria = d.isFuture ? `${d.label} — not yet`
      : `${d.label}${logged ? ` — ${d.count} logged, ${d.hours.toFixed(2)} hours` : ' — nothing logged'}`;
    return `<button class="${cls}" data-log-day-pick="${d.key}" ${d.isFuture ? 'disabled' : ''}
      aria-label="${aria}" aria-pressed="${selected}">
      <span class="lj-strip-dow">${d.initial}</span>
      <span class="lj-strip-val">${logged ? d.hours.toFixed(1) : '&mdash;'}</span>
      <span class="lj-strip-mark">${mark}</span>
    </button>`;
  }).join('');

  const start = new Date(logWeekKey + 'T00:00:00');
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const range = start.getMonth() === end.getMonth()
    ? `${start.getDate()} – ${endStr}`
    : `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${endStr}`;
  const isThisWeek = logWeekKey === getWeekKey(new Date());

  return `
    <div class="lj-weeknav">
      <button class="lj-weeknav-btn" data-log-week="-1" aria-label="Previous week">‹</button>
      <button class="lj-weeknav-label${isThisWeek ? ' current' : ''}" data-log-week="0">
        ${isThisWeek ? 'This week' : range}${isThisWeek ? `<span class="lj-weeknav-range">${range}</span>` : ''}
      </button>
      <button class="lj-weeknav-btn" data-log-week="1" aria-label="Next week" ${isThisWeek ? 'disabled' : ''}>›</button>
    </div>
    <div class="lj-strip" role="group" aria-label="Pick a day to log into">${cells}</div>`;
}

// What is already on the selected day. Engineers could tap a job, get a flash
// of colour, and have no way to tell whether it landed — or on which day. The
// day's entries sit directly under the strip, so tapping a day answers "what
// have I done here" without leaving the screen.
function buildLogDayEntries() {
  const wkKey = getWeekKey(new Date(activeLogDay + 'T00:00:00'));
  const wk = state.weeks[wkKey] || {};
  const jobs = (wk.days || {})[activeLogDay] || [];
  const deds = (wk.deductionLog || [])
    .map((d, i) => ({ ...d, logIdx: i }))
    .filter(d => d.date === activeLogDay);
  const mentor = (wk.mentorDays || {})[activeLogDay];
  const isLeave = dayIsLeave(wk, activeLogDay);
  const hours = jobs.reduce((s, j) => s + j.creditMins, 0) / 60;
  const isToday = activeLogDay === getTodayKey();
  const dayName = new Date(activeLogDay + 'T00:00:00')
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  if (jobs.length === 0 && deds.length === 0 && !mentor && !isLeave) {
    return `<div class="lj-log lj-log-empty">
      <span class="lj-log-day">${isToday ? 'Today' : dayName}</span>
      <span class="lj-log-none">Nothing logged yet — pick a job below</span>
    </div>`;
  }

  const rows = jobs.map((j, i) => {
    const ts = j.ts ? new Date(j.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
    // The same short name the row carried, so the confirmation reads as the
    // button the engineer pressed rather than the full catalogue name, which
    // is long enough to truncate on a phone.
    const meta = JOB_META[j.id] || {};
    const shown = meta.short || j.name;
    const sub = meta.sub ? ` <span class="lj-log-var">${meta.sub}</span>` : '';
    return `<div class="lj-log-row${j.ts && j.ts === lastLoggedTs ? ' just-added' : ''}">
      <span class="lj-log-ts">${ts}</span>
      <span class="lj-log-name">${shown}${sub}${j.variableInput ? ` <span class="lj-log-var">(${j.variableInput})</span>` : ''}</span>
      <span class="lj-log-credit">+${(j.creditMins / 60).toFixed(2)}h</span>
      <button class="lj-log-del" data-lj-del-day="${activeLogDay}" data-lj-del-idx="${i}" aria-label="Remove ${escAttr(j.name)}">&#10005;</button>
    </div>`;
  }).join('');

  const dedRows = deds.map(d => `
    <div class="lj-log-row">
      <span class="lj-log-ts">NPT</span>
      <span class="lj-log-name lj-log-amber">${d.name}</span>
      <span class="lj-log-credit lj-log-amber">−${(d.mins / 60).toFixed(2)}h</span>
      <button class="lj-log-del" data-lj-del-day="${activeLogDay}" data-lj-del-ded="${d.logIdx}" aria-label="Remove ${escAttr(d.name)}">&#10005;</button>
    </div>`).join('');

  const mentorRow = mentor ? `
    <div class="lj-log-row">
      <span class="lj-log-ts">—</span>
      <span class="lj-log-name lj-log-accent">${mentor === 'full' ? 'Mentor Support (Full Day)' : 'Mentor Support (20% Reduction)'}</span>
      <span class="lj-log-credit lj-log-accent">${mentor === 'full' ? 'Target 0h' : '−20%'}</span>
      <span class="lj-log-del-spacer"></span>
    </div>` : '';

  const leaveRow = isLeave ? `
    <div class="lj-log-row">
      <span class="lj-log-ts">—</span>
      <span class="lj-log-name lj-log-amber">Annual Leave</span>
      <span class="lj-log-credit lj-log-amber">Target 0h</span>
      <span class="lj-log-del-spacer"></span>
    </div>` : '';

  const count = jobs.length + deds.length;
  return `<details class="lj-log" open>
    <summary class="lj-log-head">
      <span class="lj-log-day">${isToday ? 'Today' : dayName}</span>
      <span class="lj-log-sum">${count} logged<span class="lj-log-hrs">+${hours.toFixed(2)}h</span></span>
    </summary>
    <div class="lj-log-list">${leaveRow}${rows}${dedRows}${mentorRow}</div>
  </details>`;
}

// ── Log Jobs ───────────────────────────────────────────────────────────────
const LOG_SECTIONS = [
  ['core',   'Gas',     'Services, repairs, certificates'],
  ['hive',   'Hive',    'Smart controls and leads'],
  ['sales',  'SGO',     'Sales credits and fits'],
  ['absent', 'Absence', 'Leave, NPT, mentor days']
];

function buildLogJobs() {
  // Search takes over the header when open.
  const searching = logSearchOpen || !!jobSearch.trim();
  const searchBarHTML = `
    <div class="lj-searchbar">
      <span class="lj-search-icon">${iconSearch()}</span>
      <input type="search" id="job-search" class="lj-search-input"
        placeholder="Search all 51 jobs…" value="${jobSearch}"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      ${jobSearch ? `<button id="search-clear" class="lj-search-clear">&#10005;</button>` : ''}
      <button id="search-close" class="lj-search-cancel">Cancel</button>
    </div>`;

  const isToday = activeLogDay === getTodayKey();
  const dayShort = new Date(activeLogDay + 'T00:00:00')
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  // A category, opened. The whole screen is that category's jobs: 20 gas jobs
  // want the room, and there is no doubt about which list you are in. The day
  // you are logging into comes with you — tapping a job from inside a category
  // was the moment engineers lost track of where it was landing.
  if (logCategory && !searching) {
    const [, label] = LOG_SECTIONS.find(sec => sec[0] === logCategory) || [null, ''];
    const jobs = JOB_TYPES[logCategory] || [];
    return `
      <div class="lj-cat-head">
        <button class="lj-back" id="log-cat-back" aria-label="Back to all categories">‹</button>
        <div class="lj-cat-title">${label}</div>
        <button id="log-search-open" class="lj-icon-btn" aria-label="Search jobs">${iconSearch()}</button>
      </div>
      <button class="lj-cat-day" id="log-cat-day">
        <span class="lj-cat-day-lbl">Logging into</span>
        <span class="lj-cat-day-val${isToday ? ' today' : ''}">${isToday ? 'Today' : dayShort}</span>
        <span class="lj-cat-day-chg">change</span>
      </button>
      <div class="lj-list">${jobs.map(buildJobRowHTML).join('')}</div>
      ${buildLogDayEntries()}
    `;
  }

  // Filtered results replace everything below the search bar.
  if (searching) {
    const q = jobSearch.trim().toLowerCase();
    const all = [...JOB_TYPES.core, ...JOB_TYPES.hive, ...JOB_TYPES.sales, ...JOB_TYPES.absent];
    const hits = q ? all.filter(j =>
      j.name.toLowerCase().includes(q) ||
      (JOB_META[j.id] && (JOB_META[j.id].short || '').toLowerCase().includes(q)) ||
      (JOB_META[j.id] && (JOB_META[j.id].sub || '').toLowerCase().includes(q)) ||
      (j.code && j.code.toLowerCase().includes(q))
    ) : [];
    return `
      ${searchBarHTML}
      <button class="lj-cat-day" id="log-cat-day">
        <span class="lj-cat-day-lbl">Logging into</span>
        <span class="lj-cat-day-val${isToday ? ' today' : ''}">${isToday ? 'Today' : dayShort}</span>
      </button>
      ${!q
        ? `<div class="lj-empty">Start typing to search all 51 jobs</div>`
        : hits.length > 0
          ? `<div class="lj-list">${hits.map(buildJobRowHTML).join('')}</div>`
          : `<div class="lj-empty">No jobs match “${jobSearch}”</div>`}
    `;
  }

  const voiceHTML = `
    <button class="lj-voice" id="voice-btn">
      <span class="lj-voice-ico">${iconMic()}</span>
      <span class="lj-voice-txt">
        <strong>Say what you’ve done</strong>
        <small>“six breakdowns” — or a whole week at once</small>
      </span>
    </button>`;

  // A grid, not the horizontal chip scroller Recent used: the whole point is
  // that the jobs you log every day are on screen without any scrolling at all.
  const topJobs = getTopJobs(state, 6);
  const recentHTML = topJobs.length > 0 ? `
    <div class="lj-sec">Most used</div>
    <div class="lj-top-grid">${topJobs.map(buildJobChipHTML).join('')}</div>` : '';

  // The other 45 jobs live behind four tiles rather than in one flat scroll.
  // Engineers were scrolling past Hive and SGO to reach Absence and losing
  // their place; the categories are how they already think about the work.
  const tilesHTML = `
    <div class="lj-sec">Browse all</div>
    <div class="lj-cat-grid">${LOG_SECTIONS.map(([key, label, blurb]) => `
      <button class="lj-cat-tile" data-log-cat="${key}">
        <span class="lj-cat-name">${label}</span>
        <span class="lj-cat-blurb">${blurb}</span>
        <span class="lj-cat-count">${(JOB_TYPES[key] || []).length} jobs</span>
      </button>`).join('')}</div>`;

  return `
    <div class="lj-head">
      <div class="lj-day-label${isToday ? ' today' : ''}">${isToday ? 'Today' : dayShort}</div>
      <button id="log-search-open" class="lj-icon-btn" aria-label="Search jobs">${iconSearch()}</button>
    </div>
    ${buildLogWeekStrip()}
    ${buildLogDayEntries()}
    ${voiceHTML}
    ${recentHTML}
    ${tilesHTML}
  `;
}

// ── History ────────────────────────────────────────────────────────────────
function buildHistory() {
  const currentWk = getWeekKey(new Date());
  const weeks = Object.keys(state.weeks).filter(wk => wk <= currentWk).sort().reverse();
  if (weeks.length === 0) return '<div class="empty">No history yet</div>';

  // ── Trend chart ──
  const isoWkNum = wk => {
    const d = new Date(wk + 'T00:00:00');
    const dow = d.getDay();
    const thu = new Date(d); thu.setDate(d.getDate() + 3 - (dow + 6) % 7);
    const w1 = new Date(thu.getFullYear(), 0, 4);
    return 1 + Math.round(((thu - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
  };

  const chartWeeks = weeks.filter(wk => wk < currentWk).slice(0, 8).reverse();
  let trendHTML = '';
  if (chartWeeks.length >= 1) {
    const hitCount = chartWeeks.filter(wk => bonusAchieved(state, wk)).length;
    const cols = chartWeeks.map(wk => {
      const week  = state.weeks[wk];
      const earned = weekCreditHours(week);
      const bonus  = bonusAchieved(state, wk);
      const barH   = Math.max(4, (earned / 45) * 64);
      const barCls = earned === 0 ? 'zero' : bonus ? 'green' : 'grey';
      return `<div class="trend-col" data-goto-week="${wk}"><div class="trend-bar ${barCls}" style="height:${barH.toFixed(1)}px"></div><div class="trend-wk-label${bonus ? ' green' : ''}">W${isoWkNum(wk)}</div></div>`;
    }).join('');
    // ── Self-rating dots ──
    // One dot per week, on the same columns as the bars above. Put side by side
    // and left alone: no correlation line, no "the weeks you rated X earned
    // more". If there's a pattern here it is the engineer's to spot, and theirs
    // to disagree with. See ADR-0012.
    let dotsHTML = '';
    if (isCheckinOn()) {
      const anyRated = chartWeeks.some(wk => weekCheckinAverage(state, wk) !== null);
      if (anyRated) {
        const dots = chartWeeks.map(wk => {
          const wa = weekCheckinAverage(state, wk);
          const band = checkinBand(wa ? wa.avg : null);
          const title = wa
            ? `${wa.n} self-${wa.n === 1 ? 'rating' : 'ratings'} that week`
            : 'No check-ins that week';
          return `<div class="trend-dot-col"><span class="trend-dot ${band}" title="${title}"></span></div>`;
        }).join('');
        dotsHTML = `
          <div class="trend-dots-row">${dots}</div>
          <div class="trend-dots-legend">
            <span class="trend-dot-label">Your check-in</span>
            <span class="trend-dot-key"><span class="trend-dot red"></span>not really</span>
            <span class="trend-dot-key"><span class="trend-dot amber"></span>so-so</span>
            <span class="trend-dot-key"><span class="trend-dot green"></span>mostly yes</span>
          </div>`;
      }
    }

    trendHTML = `
      <div class="trend-chart-wrap">
        <div class="trend-header">
          <span class="trend-title">WEEKLY TREND</span>
          <span class="trend-stat"><span${hitCount > 0 ? ' style="color:var(--green)"' : ''}>${hitCount}</span> / ${chartWeeks.length} weeks bonus</span>
        </div>
        <div class="trend-chart">${cols}</div>
        ${dotsHTML}
      </div>`;
  }

  const list = weeks.map(wk => {
    const week    = state.weeks[wk];
    const earned  = weekCreditHours(week);
    const target  = weekTargetHours(state, wk);
    const pct     = target > 0 ? (earned / target) * 100 : 0;
    const bonus   = bonusAchieved(state, wk);
    const colour  = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : earned === 0 ? 'grey' : 'red';
    const isCurrent = wk === currentWeekKey;
    const isPast    = wk < currentWk;
    const excluded  = week.excludeFromCtap || false;
    const isZero    = earned === 0 && isPast;
    const expanded  = expandedZeroWeek === wk;
    const showDetails = !isZero || expanded;
    return `
      <div class="history-item" data-goto-week="${wk}">
        <div class="hi-left">
          <div class="hi-week">${weekLabel(wk)}${isCurrent ? ' (current)' : ''}</div>
          <div class="hi-credits">${earned.toFixed(2)}h / ${target.toFixed(2)}h target — ${bonus ? 'Bonus ✓' : pct >= 90 ? 'On track' : pct >= 70 ? 'Amber zone' : 'Below target'}</div>
          ${showDetails && isPast ? `<div class="hi-details-row">
            <button class="ctap-toggle-btn${excluded ? ' excluded' : ''}" data-week-key="${wk}">${excluded ? '✕ Excluded' : '✓ In CTAP'}</button>
            <div class="hi-retro-field">
              <span class="hi-retro-label">Travel</span>
              <input type="number" class="retro-input" data-retro-field="travelHours" data-week-key="${wk}" value="${week.travelHours != null ? week.travelHours : ''}" placeholder="0.00" step="0.01" min="0">
              <span class="hi-retro-unit">h</span>
            </div>
          </div>` : ''}
          ${isZero && !expanded ? `<div class="hi-zero-hint">Tap for details ›</div>` : ''}
        </div>
        <div class="history-dot ${colour}"></div>
      </div>`;
  }).join('');

  return trendHTML + list;
}

// ── Settings ───────────────────────────────────────────────────────────────
// Is the starting balance a deficit? Falls back to the stored value's sign, but
// an explicit tap wins — otherwise picking "−" on a zero balance would spring
// straight back to "+", since zero has no sign to read.
function startBalNegative() {
  if (startBalSignNeg !== null) return startBalSignNeg;
  return (state.startingBalance || 0) < 0;
}

const SVG_SUN  = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="2.5"/><line x1="8" y1="1" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="1" y1="8" x2="3" y2="8"/><line x1="13" y1="8" x2="15" y2="8"/><line x1="3.5" y1="3.5" x2="4.6" y2="4.6"/><line x1="11.4" y1="11.4" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="11.4" y2="4.6"/><line x1="4.6" y1="11.4" x2="3.5" y2="12.5"/></svg>`;
const SVG_MOON = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8z"/></svg>`;

function buildSettings() {
  const isLight = document.body.classList.contains('light');
  const coachOn = isCoachModeOn();
  const checkinOn = isCheckinOn();
  const baseHours = state.baseHours || 40;
  const wkPct = Math.round((typeof state.weeklyTargetPct === 'number' ? state.weeklyTargetPct : 0.8) * 100);
  const startBal = state.startingBalance || 0;

  const sectionLabel = t => `<div class="st-section-label">${t}</div>`;
  const rowDiv = () => `<div class="st-row-divider"></div>`;
  const numInput = (id, val, unit = '', extra = '') =>
    `<div class="st-num-wrap"><input type="number" id="${id}" class="st-num-input" value="${val}" ${extra}><span class="st-num-unit">${unit}</span></div>`;
  const infoBtn = key =>
    `<button class="st-info-btn${openSettingsInfo === key ? ' active' : ''}" data-info="${key}">i</button>`;
  const infoPopover = text => `<div class="st-info-popover">${text}</div>`;

  return `
    ${sectionLabel('YOU')}
    <div class="st-card">
      <div class="st-row">
        <div style="flex:1;min-width:0">
          <span class="st-row-label">Your name</span>
          <div class="st-row-sub">Only used to greet you on the Dashboard</div>
        </div>
        <input type="text" id="display-name-input" class="st-text-input" value="${escAttr(localDisplayName())}"
          placeholder="Optional" maxlength="40" autocomplete="off" spellcheck="false">
      </div>
    </div>

    ${sectionLabel('APPEARANCE')}
    <div class="st-card">
      <div class="st-row">
        <span class="st-row-label">Theme</span>
        <div class="st-seg">
          <button class="st-seg-btn theme-btn${!isLight ? ' active' : ''}" data-theme="dark">${SVG_MOON} Dark</button>
          <button class="st-seg-btn theme-btn${isLight ? ' active' : ''}" data-theme="light">${SVG_SUN} Light</button>
        </div>
      </div>
      ${rowDiv()}
      <div class="st-row">
        <div style="flex:1;min-width:0">
          <span class="st-row-label">Coach Mode <span class="beta-badge">BETA</span></span>
          <div class="st-row-sub">Personalised tips and targets</div>
        </div>
        <label class="coach-slider-wrap">
          <input type="checkbox" id="coach-mode-toggle"${coachOn ? ' checked' : ''}>
          <span class="coach-slider"></span>
        </label>
      </div>
      ${rowDiv()}
      <div class="st-row">
        <div style="flex:1;min-width:0">
          <span class="st-row-label">Daily check-in <span class="beta-badge">BETA</span></span>
          <div class="st-row-sub">A private diary only you can read</div>
        </div>
        <label class="coach-slider-wrap">
          <input type="checkbox" id="checkin-toggle"${checkinOn ? ' checked' : ''}>
          <span class="coach-slider"></span>
        </label>
      </div>
    </div>

    ${sectionLabel('TARGETS')}
    <div class="st-card">
      <div class="st-row">
        <span class="st-row-label">Weekly hours target</span>
        <div class="st-row-controls">
          ${numInput('base-hours-input', baseHours, 'h', 'min="1" max="80" inputmode="numeric"')}
          ${infoBtn('hours')}
        </div>
      </div>
      ${openSettingsInfo === 'hours' ? infoPopover('Default 40h. Adjust each quarter as needed. Deductions are subtracted from this to get your adjusted target.') : ''}
      ${rowDiv()}
      <div class="st-row">
        <span class="st-row-label">Target %</span>
        <div class="st-row-controls">
          ${numInput('wk-pct-input', wkPct, '%', 'min="50" max="100" inputmode="numeric"')}
          ${infoBtn('pct')}
        </div>
      </div>
      ${openSettingsInfo === 'pct' ? infoPopover('Default 80%. Applied to rostered hours to set the weekly credit target. Personalises to your rolling average after 4 completed weeks.') : ''}
      ${rowDiv()}
      <div class="st-row">
        <span class="st-row-label">Starting CTAP balance</span>
        <div class="st-row-controls">
          <button class="st-sign-btn${startBalNegative() ? ' negative' : ''}" id="start-bal-sign"
            aria-label="${startBalNegative() ? 'In deficit — tap for in credit' : 'In credit — tap for in deficit'}">${startBalNegative() ? '&minus;' : '+'}</button>
          ${numInput('start-bal-input', Math.abs(startBal).toFixed(1), 'h', 'min="0" max="999" step="0.5" inputmode="decimal"')}
          ${infoBtn('balance')}
        </div>
      </div>
      ${openSettingsInfo === 'balance' ? infoPopover('Your accumulated balance carried in. Tap +/− to say whether you are in credit or in deficit, then enter the hours. Added to your weekly performance history to give your overall CTAP balance.') : ''}
    </div>

    ${sectionLabel('HELP')}
    <div class="st-card">
      <button class="st-nav-row" id="toggle-how-to">
        <span class="st-row-label">How to use this app</span>
        <span class="st-chevron${howToExpanded ? ' open' : ''}">›</span>
      </button>
      ${howToExpanded ? `<div class="st-how-to-body">
        <ol class="info-steps">
          <li><div><span class="info-step-title">Set up your schedule</span>Go to the <b>Schedule</b> tab and tap a day's times to set them, then <b>Confirm</b>. <b>Also apply to</b> puts the same times on other days. Tap <b>Standard week</b> for Mon–Fri 08:00–16:30 with default lunch. Tap <b>Leave</b> on any day to mark annual leave. Saves automatically.</div></li>
          <li><div><span class="info-step-title">Log your jobs</span>Tap <b>Log Job</b> and pick a category — Core, Hive, Sales, or Absence. Tap a tile to log instantly; dashed tiles ask for extra input. You can also tap <b>+ Add a job</b> at the bottom of <b>Today's Jobs</b> on the Dashboard.</div></li>
          <li><div><span class="info-step-title">Track on the Dashboard</span>See today's credit hours, the week's progress and a day-by-day chart. Tap the <b>CTAP</b> tile to open the cash-out sheet (what your balance is worth after tax). Tap the <b>Week</b> tile for the full weekly forecast with per-day detail.</div></li>
          <li><div><span class="info-step-title">Understand your CTAP balance</span>CTAP is your running credit or deficit. It starts from your starting balance, then each completed week's surplus or shortfall is added. Green = in credit. You can only cash out when in credit.</div></li>
          <li><div><span class="info-step-title">History tab</span>View past weeks with a colour-coded dot. Tap any week to jump to it. Tap <b>✓ In CTAP</b> to exclude a week from your balance calculation.</div></li>
          <li><div><span class="info-step-title">Your data stays on this phone</span>There's no account and no sign-in — everything you log is stored on this device only, and works with no signal. It isn't backed up anywhere, so if you delete the app or erase the data in Settings, it's gone.</div></li>
        </ol>
      </div>` : ''}
    </div>

    ${sectionLabel('ABOUT')}
    <div class="st-card">
      <div class="st-row">
        <span class="st-row-label">Version</span>
        <span class="st-row-value">v0.8.0 · on-device</span>
      </div>
      ${rowDiv()}
      <button class="st-nav-row" id="toggle-legal-info">
        <span class="st-row-label">Legal &amp; data</span>
        <span class="st-chevron${legalInfoExpanded ? ' open' : ''}">›</span>
      </button>
      ${legalInfoExpanded ? `<div class="st-credits-body">
        <p class="st-legal-p">Numbers shown here are personal estimates and may not match official Centrica or British Gas systems. Always check your CTAP balance and pay against your payslip and company tools before acting on them.</p>
        <p class="st-legal-p">This app isn't affiliated with, endorsed by, or representative of Centrica plc, British Gas, or any employer. It's a personal tool, provided as-is with no warranty.</p>
        <p class="st-legal-p">Anything you enter is kept on this device and nowhere else. There is no account, no server, and no upload — your figures are never transmitted, so no one but you can read them. Nothing is shared with third parties, your employer included.</p>
      </div>` : ''}
      ${rowDiv()}
      <div class="st-row">
        <span class="st-row-label">Built by</span>
        <div class="st-row-value-stack">
          <span class="st-row-value">Jake Rainford</span>
          <span class="st-row-value-sub">Service &amp; Repair Engineer</span>
        </div>
      </div>
      ${rowDiv()}
      <div class="st-row">
        <span class="st-row-label">Questions or feedback?</span>
        <span class="st-row-value">Reach out on Teams</span>
      </div>
    </div>

    <div class="dashboard-card settings-account-card">
      <div class="settings-sync-title">This data is yours alone</div>
      <p class="settings-sync-sub">Everything you log lives on this phone and nowhere else. There's no account, no sign-in, and nothing is uploaded — so no one else can see your figures. Erasing here is the only way it goes, and deleting the app takes it with you.</p>
      ${eraseDataStep === 'idle' ? `
        <button id="erase-data-btn" class="settings-delete-btn">Erase all data</button>
      ` : `
        <div class="settings-delete-confirm">
          <div class="settings-delete-warn">This wipes every job, week, shift, check-in and setting from this phone. There's no copy anywhere else, so it can't be undone.</div>
          <label class="settings-delete-label">Type <b>ERASE</b> to confirm</label>
          <input type="text" id="delete-confirm-input" class="settings-delete-input" autocapitalize="characters" autocomplete="off" spellcheck="false">
          <div class="settings-delete-btns">
            <button id="delete-cancel-btn" class="settings-delete-cancel">Cancel</button>
            <button id="delete-confirm-btn" class="settings-delete-confirm-btn" disabled>Permanently erase</button>
          </div>
        </div>
      `}
    </div>

    <div class="st-footer">Personal estimates only — verify against official systems.</div>
  `;
}


// ── Modal ──────────────────────────────────────────────────────────────────
function buildModal() {
  return `
    <div class="modal-overlay hidden" id="modal-overlay">
      <div class="modal">
        <h3 id="modal-title"></h3>
        <p id="modal-desc"></p>
        <input type="number" id="modal-input" min="1" step="1" placeholder="0">
        <input type="text" id="modal-name" placeholder="Reason (optional)" style="display:none;margin-top:10px;width:100%;background:var(--surface2);border:none;border-radius:10px;color:var(--fg);font-size:0.9rem;padding:10px 12px;outline:none;box-sizing:border-box;-webkit-appearance:none">
        <div class="modal-btns">
          <button class="btn-cancel" id="modal-cancel">Cancel</button>
          <button class="btn-confirm" id="modal-confirm">Log Job</button>
        </div>
      </div>
    </div>
  `;
}

// ── Week pace figures ──────────────────────────────────────────────
// The Week tile and the Weekly Forecast sheet both answer "where does this
// week land?", and they used to work it out separately. They drifted — the
// same Tuesday could read one pace on the tile and another in the sheet. One
// function now, so the tile is a preview of the sheet rather than a rival to
// it. Nothing here is a figure from the business: it is the engineer's own
// logged credits, projected forward at the pace those credits set.
function weekPaceFigures(weekKey, week) {
  const todayKey = getTodayKey();
  const todayWk = getWeekKey(new Date());
  const isPastWeek = weekKey < todayWk;
  const isFutureWeek = weekKey > todayWk;
  const wDays = weekDays(weekKey);

  const earnedHours = weekCreditHours(week);
  const targetHours = weekTargetHours(state, weekKey);

  // Days with at least one job logged (past + today).
  const workedDayKeys = wDays.filter(dk => {
    const jobs = (week.days || {})[dk] || [];
    return jobs.length > 0 && (isPastWeek || dk <= todayKey);
  });

  // Remaining working days: today onwards, still empty. Leave and rest days
  // aren't working days, so a Friday off doesn't thin the target over an
  // extra day — see ADR-0017.
  const remainingDayKeys = isPastWeek ? [] : wDays.filter(dk => {
    if (dk < todayKey) return false;
    if (!isWorkingDay(week, dk)) return false;
    return ((week.days || {})[dk] || []).length === 0;
  });

  const daysWorked = workedDayKeys.length;
  const daysRemaining = remainingDayKeys.length;

  const dayTotals = workedDayKeys.map(dk =>
    ((week.days || {})[dk] || []).reduce((s, j) => s + j.creditMins, 0) / 60
  );

  const dailyAvg = daysWorked > 0 ? earnedHours / daysWorked : 0;
  const bestDay  = dayTotals.length > 0 ? Math.max(...dayTotals) : 0;
  const worstDay = dayTotals.length > 0 ? Math.min(...dayTotals) : 0;

  // paceProjection returns null once there is nothing left to project over.
  // At that point the week has landed, so the prediction is what was logged.
  const proj = paceProjection(earnedHours, daysWorked, daysRemaining, targetHours);
  const projected = proj ? proj.projectedHours : (daysWorked > 0 ? earnedHours : null);

  return {
    earnedHours: earnedHours,
    targetHours: targetHours,
    daysWorked: daysWorked,
    daysRemaining: daysRemaining,
    dayTotals: dayTotals,
    dailyAvg: dailyAvg,
    bestDay: bestDay,
    worstDay: worstDay,
    projected: projected,
    projGap: projected !== null ? projected - targetHours : null,
    bestCase: daysWorked > 0 && daysRemaining > 0 ? earnedHours + bestDay * daysRemaining : null,
    worstCase: daysWorked > 0 && daysRemaining > 0 ? earnedHours + worstDay * daysRemaining : null,
    neededPer: daysRemaining > 0 ? Math.max(0, targetHours - earnedHours) / daysRemaining : 0,
    isPastWeek: isPastWeek,
    isFutureWeek: isFutureWeek,
    // True once the week can no longer move: a past week, or a current week
    // with every working day logged.
    isSettled: isPastWeek || (!isFutureWeek && daysRemaining === 0)
  };
}

// ── Week Forecast Sheet ────────────────────────────────────────────────────
// ── Shift sheet ────────────────────────────────────────────────────────────
// A day's times are set here, with a Confirm, rather than in two native time
// inputs. Those saved and redrew the Schedule on every change, and the redraw
// threw away the input the iPhone's wheel belonged to, so the wheel closed as
// soon as an hour was picked and the minutes were never reachable.
//
// Nothing changes until Confirm. The same times can go onto other days chosen
// one by one, because a working week is often not Monday to Friday: Monday to
// Thursday, off Friday, back in on Saturday. Days on leave are never touched.
const SHIFT_MINUTE_STEP = 5;
const SHIFT_DEFAULT_TIMES = { start: '08:00', end: '16:30' };
const SHIFT_DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function shiftClockMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// A day keeps its own lunch; a day without one takes the default, as Standard
// week does, so a shift set here and one set by Standard week count the same.
function shiftSheetLunch(shift) {
  if (shift && shift.lunch !== undefined && shift.lunch !== '') return String(shift.lunch);
  return String(state.defaultLunch !== undefined ? state.defaultLunch : 30);
}

function openShiftSheet(dk) {
  const days = weekDays(currentWeekKey);
  const shifts = getOrCreateWeek(state, currentWeekKey).shifts || {};
  const own = shifts[dk] || {};
  // An empty day starts from the nearest earlier day with a shift, so a week of
  // the same times is one Confirm a day even without choosing days to copy to.
  let from = own.start && own.end ? own : null;
  for (let i = days.indexOf(dk) - 1; !from && i >= 0; i--) {
    const s = shifts[days[i]];
    if (s && s.start && s.end && !s.leave) from = s;
  }
  shiftSheet = {
    dk,
    start: (from && from.start) || SHIFT_DEFAULT_TIMES.start,
    end: (from && from.end) || SHIFT_DEFAULT_TIMES.end,
    applyTo: [],
  };
  render();
  centreShiftWheels(false);
}

function buildShiftWheel(name, values, selected, label) {
  return `<div class="shift-wheel" data-wheel="${name}" role="listbox" aria-label="${label}">${values.map(v =>
    `<button type="button" class="shift-wheel-opt${v === selected ? ' is-selected' : ''}" role="option" aria-selected="${v === selected}" data-value="${v}">${v}</button>`
  ).join('')}</div>`;
}

function buildShiftSheet() {
  if (!shiftSheet) return '';
  const [sh, sm] = shiftSheet.start.split(':');
  const [eh, em] = shiftSheet.end.split(':');
  const dateLabel = new Date(shiftSheet.dk + 'T00:00:00')
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  // Five-minute steps, plus the minute a day already has if it is off-step, so
  // opening and confirming an 08:07 start never quietly moves it.
  const minutesWith = (m) => {
    const steps = Array.from({ length: 60 / SHIFT_MINUTE_STEP }, (_, i) => String(i * SHIFT_MINUTE_STEP).padStart(2, '0'));
    return [...new Set([...steps, m])].sort();
  };
  return `
    <div class="forecast-sheet shift-sheet" id="shift-sheet">
      <div class="forecast-backdrop" id="shift-backdrop"></div>
      <div class="forecast-panel" role="dialog" aria-modal="true" aria-labelledby="shift-sheet-title">
        <div class="forecast-handle"></div>
        <div class="forecast-header">
          <span class="forecast-title" id="shift-sheet-title">${dateLabel}</span>
          <button class="forecast-close" id="shift-close" aria-label="Close without saving">✕</button>
        </div>
        <div class="forecast-body">
          <div class="shift-times">
            <div class="shift-time-col">
              <div class="shift-time-label">Start</div>
              <div class="shift-wheels">${buildShiftWheel('start-h', hours, sh, 'Start hour')}<span class="shift-wheel-colon">:</span>${buildShiftWheel('start-m', minutesWith(sm), sm, 'Start minutes')}</div>
            </div>
            <div class="shift-time-col">
              <div class="shift-time-label">Finish</div>
              <div class="shift-wheels">${buildShiftWheel('end-h', hours, eh, 'Finish hour')}<span class="shift-wheel-colon">:</span>${buildShiftWheel('end-m', minutesWith(em), em, 'Finish minutes')}</div>
            </div>
          </div>
          <div id="shift-sheet-foot">${buildShiftSheetFoot()}</div>
        </div>
      </div>
    </div>`;
}

// Everything under the wheels, redrawn whenever a value or a chosen day changes.
function buildShiftSheetFoot() {
  const { dk, start, end, applyTo } = shiftSheet;
  const week = state.weeks[currentWeekKey] || {};
  const lunch = shiftSheetLunch((week.shifts || {})[dk]);
  const valid = shiftClockMinutes(end) > shiftClockMinutes(start);
  const hrs = shiftHours({ start, end, lunch });
  const count = 1 + applyTo.length;
  const chips = weekDays(currentWeekKey).map((d, i) => {
    if (d === dk) return `<span class="shift-apply-chip is-self">${SHIFT_DAY_ABBR[i]}</span>`;
    const onLeave = dayIsLeave(week, d);
    const on = applyTo.includes(d);
    return `<button type="button" class="shift-apply-chip${on ? ' is-on' : ''}" data-apply-day="${d}" aria-pressed="${on}"${onLeave ? ' disabled' : ''}>${SHIFT_DAY_ABBR[i]}${onLeave ? '<small>Leave</small>' : ''}</button>`;
  }).join('');
  const preview = valid
    ? `${start} – ${end} · ${hrs !== null ? hrs.toFixed(1) : '0.0'}h${Number(lunch) > 0 ? ` <span>after ${lunch} min lunch</span>` : ''}`
    : `${start} – ${end} <span>Finish must be after the start</span>`;
  return `
    <div class="shift-preview${valid ? '' : ' is-invalid'}" id="shift-preview">${preview}</div>
    <div class="shift-apply">
      <div class="shift-apply-head">
        <span class="shift-apply-label">Also apply to</span>
        <span class="shift-apply-shortcuts">
          <button type="button" class="shift-apply-shortcut" id="apply-rest-week">Rest of week</button>
          <button type="button" class="shift-apply-shortcut" id="apply-whole-week">Whole week</button>
        </span>
      </div>
      <div class="shift-apply-days">${chips}</div>
    </div>
    <button type="button" class="shift-confirm-btn" id="shift-confirm"${valid ? '' : ' disabled'}>${count === 1 ? 'Confirm' : `Confirm for ${count} days`}</button>
    <button type="button" class="shift-clear-btn" id="shift-clear">Clear this day's times</button>`;
}

// "Rest of week" is the weekdays after the day being set; "Whole week" is every
// other day, the weekend included. Neither ever includes a day on leave.
function shiftSheetDaysFor(scope) {
  const days = weekDays(currentWeekKey);
  const week = state.weeks[currentWeekKey] || {};
  const from = days.indexOf(shiftSheet.dk);
  return days.filter((d, i) => d !== shiftSheet.dk && !dayIsLeave(week, d)
    && (scope === 'whole' || (i > from && i < 5)));
}

function setShiftSheetValue(wheel, value) {
  const [which, part] = wheel.split('-');   // 'start' | 'end', 'h' | 'm'
  const [h, m] = shiftSheet[which].split(':');
  shiftSheet[which] = part === 'h' ? `${value}:${m}` : `${h}:${value}`;
}

function refreshShiftSheet() {
  const sheet = document.getElementById('shift-sheet');
  if (!sheet || !shiftSheet) return;
  const selected = {
    'start-h': shiftSheet.start.split(':')[0], 'start-m': shiftSheet.start.split(':')[1],
    'end-h': shiftSheet.end.split(':')[0], 'end-m': shiftSheet.end.split(':')[1],
  };
  sheet.querySelectorAll('[data-wheel]').forEach(w => {
    w.querySelectorAll('[data-value]').forEach(o => {
      const on = o.dataset.value === selected[w.dataset.wheel];
      o.classList.toggle('is-selected', on);
      o.setAttribute('aria-selected', String(on));
    });
  });
  const foot = document.getElementById('shift-sheet-foot');
  if (foot) foot.innerHTML = buildShiftSheetFoot();
}

function centreShiftWheels(smooth) {
  document.querySelectorAll('#shift-sheet .shift-wheel').forEach(w => {
    const sel = w.querySelector('.is-selected');
    if (!sel) return;
    const top = sel.offsetTop - (w.clientHeight - sel.offsetHeight) / 2;
    if (typeof w.scrollTo === 'function') w.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
    else w.scrollTop = top;
  });
}

function shiftWheelValueAtCentre(w) {
  if (!w.clientHeight) return null;
  const centre = w.scrollTop + w.clientHeight / 2;
  let best = null;
  let bestDistance = Infinity;
  w.querySelectorAll('[data-value]').forEach(o => {
    const distance = Math.abs(o.offsetTop + o.offsetHeight / 2 - centre);
    if (distance < bestDistance) { bestDistance = distance; best = o; }
  });
  return best ? best.dataset.value : null;
}

function confirmShiftSheet() {
  if (!shiftSheet) return;
  const { dk, start, end, applyTo } = shiftSheet;
  if (shiftClockMinutes(end) <= shiftClockMinutes(start)) return;
  const week = getOrCreateWeek(state, currentWeekKey);
  if (!week.shifts) week.shifts = {};
  [dk, ...applyTo].forEach(d => {
    if (dayIsLeave(week, d)) return;
    const s = week.shifts[d] || (week.shifts[d] = {});
    s.start = start;
    s.end = end;
    s.lunch = shiftSheetLunch(s);
  });
  shiftSheet = null;
  saveState(state);
  render();
  showToast(applyTo.length ? `Shift set for ${applyTo.length + 1} days` : 'Shift saved');
}

function clearShiftSheetDay() {
  if (!shiftSheet) return;
  const s = (getOrCreateWeek(state, currentWeekKey).shifts || {})[shiftSheet.dk];
  if (s) { delete s.start; delete s.end; delete s.lunch; }
  shiftSheet = null;
  saveState(state);
  render();
  showToast('Times cleared');
}

// ── Day strip + detail panel (shared by forecast & summary sheets) ──────────
// All seven days: a week is seven days, each with an optional shift, and a
// Saturday worked has to be findable here like any other day.
function buildDayStrip(weekKey, week, activeDk) {
  const days = weekDays(weekKey);
  const DAY_ABB = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return `<div class="day-strip" data-week-key="${weekKey}">${days.map((dk, i) => {
    const h = ((week.days || {})[dk] || []).reduce((s, j) => s + j.creditMins, 0) / 60;
    const isLeave = dayIsLeave(week, dk);
    const lbl = isLeave ? 'AL' : h > 0 ? h.toFixed(1) + 'h' : isRestDay(week, dk) ? 'Rest' : '—';
    return `<button class="dsp-pill${dk === activeDk ? ' dsp-active' : ''}" data-strip-day="${dk}">
      <span class="dsp-abbr">${DAY_ABB[i]}</span>
      <span class="dsp-hrs">${lbl}</span>
    </button>`;
  }).join('')}</div>`;
}

function buildDayDetailPanel(weekKey, week, dk, editMode) {
  const jobs = (week.days || {})[dk] || [];
  const allDeds = week.deductionLog || [];
  const dayDeds = allDeds.map((d, i) => ({ ...d, logIdx: i })).filter(d => d.date === dk);
  const mentor = (week.mentorDays || {})[dk];
  const isLeave = dayIsLeave(week, dk);
  const creditsH = jobs.reduce((s, j) => s + j.creditMins, 0) / 60;
  const dateLabel = new Date(dk + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const isEmpty = jobs.length === 0 && dayDeds.length === 0 && !mentor && !isLeave;

  const dayNote = ((week.shifts || {})[dk] || {}).note;
  const noteBlock = dayNote && dayNote.trim()
    ? `<div class="ddp-note">${dayNote.replace(/</g, '&lt;')}</div>`
    : '';

  const header = `<div class="ddp-header">
    <div class="ddp-date">${dateLabel}</div>
    <div class="ddp-stats-row">
      <span class="ddp-stat">Earned <span class="ddp-stat-val">${isLeave ? '—' : creditsH.toFixed(2) + 'h'}</span></span>
    </div>
  </div>
  ${noteBlock}`;

  if (editMode && jobs.length > 0) {
    const editRows = jobs.map((j, i) => {
      const dt = j.startTime ? new Date(j.startTime) : null;
      const tsVal = dt ? `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}` : '';
      return `<div class="ddp-row ddp-row-edit">
        <span class="ddp-name">${j.name}${j.variableInput ? ` <span class="ddp-var">(${j.variableInput})</span>` : ''}</span>
        <input type="time" class="ddp-time-input" data-job-edit-idx="${i}" value="${tsVal}">
      </div>`;
    }).join('');
    return `<div class="day-detail-panel">
      ${header}
      <div class="ddp-list">${editRows}</div>
      <div class="ddp-edit-footer">
        <button class="ddp-cancel-edit-btn">Cancel</button>
        <button class="ddp-save-times-btn" data-week-key="${weekKey}" data-day-key="${dk}">Save</button>
      </div>
    </div>`;
  }

  const jobRows = jobs.map((j, i) => {
    const tsStr = j.startTime
      ? new Date(j.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '';
    return `<div class="ddp-row">
      ${tsStr ? `<span class="ddp-ts">${tsStr}</span>` : ''}
      <span class="ddp-name">${j.name}${j.variableInput ? ` <span class="ddp-var">(${j.variableInput})</span>` : ''}</span>
      <span class="ddp-pill">+${(j.creditMins / 60).toFixed(2)}h</span>
      <button class="ddp-del" data-week-key="${weekKey}" data-day-key="${dk}" data-job-idx="${i}" title="Remove">×</button>
    </div>`;
  }).join('');

  const dedRows = dayDeds.map(d => `
    <div class="ddp-row">
      <span class="ddp-name ddp-amber">${d.name}</span>
      <span class="ddp-pill ddp-pill-amber">−${(d.mins / 60).toFixed(2)}h</span>
      <button class="ddp-del" data-week-key="${weekKey}" data-day-key="${dk}" data-ded-idx="${d.logIdx}" title="Remove">×</button>
    </div>`).join('');

  const mentorRow = mentor ? `
    <div class="ddp-row">
      <span class="ddp-name ddp-accent">${mentor === 'full' ? 'Mentor Support (Full Day)' : 'Mentor Support (20% Reduction)'}</span>
      <span class="ddp-pill ddp-pill-accent">${mentor === 'full' ? 'Target 0h' : '−20%'}</span>
      <button class="ddp-del" data-week-key="${weekKey}" data-day-key="${dk}" data-del-mentor="" title="Remove">×</button>
    </div>` : '';

  const leaveRow = isLeave ? `
    <div class="ddp-row"><span class="ddp-name ddp-amber">Annual Leave</span><span class="ddp-pill ddp-pill-amber">Target 0h</span></div>` : '';

  const editTimesBtn = jobs.length > 0
    ? `<button class="ddp-edit-times-btn" data-week-key="${weekKey}" data-day-key="${dk}">Edit Times</button>`
    : '';

  return `<div class="day-detail-panel">
    ${header}
    ${isEmpty
      ? `<button class="ddp-empty-btn" data-log-day="${dk}">Nothing logged<span class="ddp-empty-arrow"> · tap to log →</span></button>`
      : `<div class="ddp-list">${leaveRow}${jobRows}${dedRows}${mentorRow}</div>
         <div class="ddp-total"><span class="ddp-total-label">Day total</span><span class="ddp-total-val">${creditsH.toFixed(2)}h</span></div>
         ${editTimesBtn}`
    }
  </div>`;
}

function handleSheetInteraction(e) {
  const logDayBtn = e.target.closest('[data-log-day]');
  if (logDayBtn) {
    e.stopPropagation();
    forecastSheetOpen = false;
    weekSummaryKey = null;
    setLogDay(logDayBtn.dataset.logDay);
    activeTab = 'log';
    render();
    return;
  }

  const pill = e.target.closest('[data-strip-day]');
  if (pill) {
    e.stopPropagation();
    dayEditMode = false;
    const dk = pill.dataset.stripDay;
    activeDayKey = dk;
    const strip = pill.closest('.day-strip');
    const weekKey = strip && strip.dataset.weekKey;
    if (!weekKey) return;
    const wk = state.weeks[weekKey] || {};
    strip.querySelectorAll('[data-strip-day]').forEach(b => {
      b.classList.toggle('dsp-active', b.dataset.stripDay === dk);
    });
    const wrap = pill.closest('.forecast-panel').querySelector('.day-detail-wrap');
    if (wrap) wrap.innerHTML = buildDayDetailPanel(weekKey, wk, dk, false);
    return;
  }

  const editTimesBtn = e.target.closest('.ddp-edit-times-btn');
  if (editTimesBtn) {
    e.stopPropagation();
    dayEditMode = true;
    const weekKey = editTimesBtn.dataset.weekKey;
    const dayKey = editTimesBtn.dataset.dayKey;
    const wk = state.weeks[weekKey] || {};
    const wrap = editTimesBtn.closest('.forecast-panel').querySelector('.day-detail-wrap');
    if (wrap) wrap.innerHTML = buildDayDetailPanel(weekKey, wk, dayKey, true);
    return;
  }

  const cancelEditBtn = e.target.closest('.ddp-cancel-edit-btn');
  if (cancelEditBtn) {
    e.stopPropagation();
    dayEditMode = false;
    const saveBtn = cancelEditBtn.closest('.ddp-edit-footer') && cancelEditBtn.closest('.ddp-edit-footer').querySelector('.ddp-save-times-btn');
    const weekKey = saveBtn && saveBtn.dataset.weekKey;
    const dayKey = saveBtn && saveBtn.dataset.dayKey;
    if (weekKey && dayKey) {
      const wk = state.weeks[weekKey] || {};
      const wrap = cancelEditBtn.closest('.forecast-panel').querySelector('.day-detail-wrap');
      if (wrap) wrap.innerHTML = buildDayDetailPanel(weekKey, wk, dayKey, false);
    }
    return;
  }

  const saveTimesBtn = e.target.closest('.ddp-save-times-btn');
  if (saveTimesBtn) {
    e.stopPropagation();
    const weekKey = saveTimesBtn.dataset.weekKey;
    const dayKey = saveTimesBtn.dataset.dayKey;
    const wk = state.weeks[weekKey];
    const panel = saveTimesBtn.closest('.day-detail-panel');
    if (wk && panel) {
      panel.querySelectorAll('.ddp-time-input').forEach(input => {
        const idx = parseInt(input.dataset.jobEditIdx, 10);
        const timeVal = input.value;
        if ((wk.days || {})[dayKey] && wk.days[dayKey][idx] !== undefined) {
          if (timeVal) {
            const [h, m] = timeVal.split(':').map(Number);
            const d = new Date(dayKey + 'T00:00:00');
            d.setHours(h, m, 0, 0);
            wk.days[dayKey][idx].startTime = d.toISOString();
          } else {
            delete wk.days[dayKey][idx].startTime;
          }
        }
      });
      saveState(state);
    }
    dayEditMode = false;
    const week = state.weeks[weekKey] || {};
    const wrap = saveTimesBtn.closest('.forecast-panel').querySelector('.day-detail-wrap');
    if (wrap) wrap.innerHTML = buildDayDetailPanel(weekKey, week, dayKey, false);
    return;
  }

  const del = e.target.closest('.ddp-del');
  if (del) {
    e.stopPropagation();
    const weekKey = del.dataset.weekKey;
    const dayKey = del.dataset.dayKey;
    const wk = state.weeks[weekKey];
    if (!wk) return;
    if ('delMentor' in del.dataset) {
      if (wk.mentorDays) delete wk.mentorDays[dayKey];
    } else if ('dedIdx' in del.dataset) {
      const idx = parseInt(del.dataset.dedIdx, 10);
      if (wk.deductionLog) {
        wk.deductionLog.splice(idx, 1);
        wk.deductionMins = wk.deductionLog.reduce((s, d) => s + d.mins, 0);
      }
    } else if ('jobIdx' in del.dataset) {
      const idx = parseInt(del.dataset.jobIdx, 10);
      if ((wk.days || {})[dayKey]) {
        wk.days[dayKey].splice(idx, 1);
        if (wk.days[dayKey].length === 0) delete wk.days[dayKey];
      }
    }
    saveState(state);
    const sheetEl = del.closest('#forecast-sheet') || del.closest('#week-summary-sheet');
    if (sheetEl) refreshSheetInPlace(sheetEl.id);
  }
}

function buildWeekForecastSheet() {
  const week = getOrCreateWeek(state, currentWeekKey);
  const todayKey = getTodayKey();
  const todayWk = getWeekKey(new Date());
  const wDays = weekDays(currentWeekKey);

  // A past week and the current one are asked the same question now; this used
  // to branch, which is how the same week read hit on Monday and missed on
  // Sunday. See weekTargetHours.
  const f = weekPaceFigures(currentWeekKey, week);
  const isPastWeek    = f.isPastWeek;
  const isFutureWeek  = f.isFutureWeek;
  const earnedHours   = f.earnedHours;
  const targetHours   = f.targetHours;
  const daysWorked    = f.daysWorked;
  const daysRemaining = f.daysRemaining;
  const dailyAvg      = f.dailyAvg;
  const bestDay       = f.bestDay;
  const worstDay      = f.worstDay;
  const projected     = f.projected;
  const projGap       = f.projGap;
  const bestCase      = f.bestCase;
  const worstCase     = f.worstCase;
  const neededPer     = f.neededPer;

  const pct       = targetHours > 0 ? Math.min((earnedHours / targetHours) * 100, 100) : 0;
  const barColour = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red';
  const isFinalTone = f.isSettled;
  const initDay   = (activeDayKey && wDays.includes(activeDayKey)) ? activeDayKey : wDays[0];

  // Plain English summary
  let summary;
  if (isFinalTone) {
    const gap = earnedHours - targetHours;
    summary = gap >= 0
      ? `Week complete — finished ${gap.toFixed(2)}h above target. Bonus achieved ✓`
      : `Week complete — finished ${Math.abs(gap).toFixed(2)}h short of the ${targetHours.toFixed(1)}h target.`;
  } else if (isFutureWeek || daysWorked === 0) {
    summary = `No jobs logged yet this week. Target is ${targetHours.toFixed(1)}h.`;
  } else {
    const targetTrim = Number(targetHours.toFixed(1));
    summary = projGap >= 0
      ? `At your current pace, you'll finish on ${projected.toFixed(2)} hours. This is ${projGap.toFixed(2)} hours above your ${targetTrim}-hour target.`
      : `At your current pace, you'll finish on ${projected.toFixed(2)} hours. This is ${Math.abs(projGap).toFixed(2)} hours short of your ${targetTrim}-hour target.`;
  }

  // Needed per day notice
  let neededStr = '';
  if (!isFinalTone && !isFutureWeek && daysRemaining > 0) {
    neededStr = earnedHours >= targetHours
      ? 'Target already reached — bonus secured!'
      : `${neededPer.toFixed(2)}h average per remaining day to hit your ${targetHours.toFixed(1)}h target`;
  }

  // Insights for current week only
  let insightsHTML = '';
  if (currentWeekKey === todayWk) {
    const todayJobs = (week.days || {})[todayKey] || [];
    const todayHrs  = todayJobs.reduce((s, j) => s + j.creditMins, 0) / 60;
    const dailyTgt  = adjustedDailyTargetHours(state, week, todayKey);
    const pfMins    = estimatedDailyPFMins(dailyRawOutputHours(state, week, todayKey));
    insightsHTML = buildInsightsCard(dailyTgt, todayHrs, targetHours, earnedHours, pfMins);
  }

  return `
    <div class="forecast-sheet${forecastSheetOpen ? '' : ' hidden'}" id="forecast-sheet">
      <div class="forecast-backdrop" id="forecast-backdrop"></div>
      <div class="forecast-panel">
        <div class="forecast-handle"></div>
        <div class="forecast-header">
          <span class="forecast-title">Weekly Forecast</span>
          <button class="forecast-close" id="forecast-close">✕</button>
        </div>
        <div class="forecast-body">

          ${buildDayStrip(currentWeekKey, week, initDay)}
          <div class="day-detail-wrap">${buildDayDetailPanel(currentWeekKey, week, initDay, dayEditMode)}</div>
          <div class="ddp-divider"></div>

          <div class="forecast-prog-row">
            <span class="forecast-prog-label">Credits earned</span>
            <span class="forecast-prog-val">${earnedHours.toFixed(2)}h <span class="forecast-prog-of">of ${targetHours.toFixed(1)}h</span></span>
          </div>
          <div class="progress-bar" style="margin:7px 0 4px">
            <div class="progress-bar-fill ${barColour}" style="width:${pct.toFixed(1)}%"></div>
          </div>
          <div style="font-size:0.62rem;color:var(--muted);text-align:right;margin-bottom:4px">${Math.round(pct)}% of target</div>
          ${buildCtapTrend()}

          <div class="forecast-summary-box">
            <div class="forecast-summary-text">${summary}</div>
          </div>

          ${!isFutureWeek && daysWorked > 0 ? `
          <div class="forecast-stats">
            ${projected !== null ? `<div class="forecast-stat">
              <div class="forecast-stat-label">Projected</div>
              <div class="forecast-stat-val ${projGap >= 0 ? 'green' : 'red'}">${projected.toFixed(2)}h</div>
            </div>` : ''}
            <div class="forecast-stat">
              <div class="forecast-stat-label">Daily avg</div>
              <div class="forecast-stat-val">${dailyAvg.toFixed(2)}h</div>
            </div>
            <div class="forecast-stat">
              <div class="forecast-stat-label">Days worked</div>
              <div class="forecast-stat-val">${daysWorked}</div>
            </div>
            ${!isPastWeek ? `<div class="forecast-stat">
              <div class="forecast-stat-label">Days left</div>
              <div class="forecast-stat-val">${daysRemaining}</div>
            </div>` : ''}
          </div>` : ''}

          ${neededStr ? `<div class="forecast-needed"><span class="forecast-needed-arrow">→</span>${neededStr}</div>` : ''}

          ${bestCase !== null && worstCase !== null ? `
          <div class="forecast-range">
            <div class="forecast-range-label">Best / worst case</div>
            <div class="forecast-range-vals">
              <span class="forecast-range-best">${bestCase.toFixed(2)}h</span>
              <span class="forecast-range-sep"> – </span>
              <span class="forecast-range-worst">${worstCase.toFixed(2)}h</span>
            </div>
            <div class="forecast-range-note">Best day ${bestDay.toFixed(2)}h · Worst day ${worstDay.toFixed(2)}h</div>
          </div>` : ''}

          ${insightsHTML ? `<div style="margin-top:4px">${insightsHTML}</div>` : ''}

        </div>
      </div>
    </div>
  `;
}

const CASH_OUT_HOURLY_RATE = 19.39;
const CASH_OUT_MULTIPLIERS = [0, 0.8, 1.4, 2];
const CASH_OUT_TAX_BANDS = {
  gross:  { label: 'Gross',  deduction: 0,    sub: 'No deductions' },
  basic:  { label: 'Basic',  deduction: 0.28, sub: '20% tax + 8% NI' },
  higher: { label: 'Higher', deduction: 0.42, sub: '40% tax + 2% NI' },
};

// The modeller's two lines of prose. Shared, because they are written both by
// the render and by the live patch that runs while the engineer types — two
// copies would drift the moment either was edited.
function clampCashOutHours(v) {
  if (isNaN(v)) return 0;
  return Math.max(0, Math.min(999, Math.round(v * 100) / 100));
}

function cashOutModelNote(modelHours, payableHours) {
  const diff = modelHours - payableHours;
  if (Math.abs(diff) <= 0.005) return '';
  // Said plainly: this is a price, not an entitlement. The sheet's own
  // "Payable balance" row above is the figure that can actually be drawn.
  return diff > 0
    ? `Pricing ${modelHours.toFixed(2)}h — ${diff.toFixed(2)}h more than you can draw today.`
    : `Pricing ${modelHours.toFixed(2)}h — ${Math.abs(diff).toFixed(2)}h less than your ${payableHours.toFixed(2)}h balance.`;
}

function cashOutBreakdown(hours, multiplier, band) {
  return `${hours.toFixed(2)}h × £${CASH_OUT_HOURLY_RATE.toFixed(2)} × ${multiplier}× ${band.deduction > 0 ? `− ${Math.round(band.deduction * 100)}% deductions` : ''}`;
}

// Typing has to move the money live — that is the whole point of a modeller.
// refreshSheetInPlace rebuilds panel.innerHTML, which would blow the caret out
// of the field on every keystroke, so the figures are patched in place instead.
function patchCashOutFigures() {
  const bal = cumulativeBalance(state);
  const payableHours = Math.max(0, bal);
  const modelHours = cashOutHours === null ? payableHours : cashOutHours;
  const multiplier = CASH_OUT_MULTIPLIERS.includes(cashOutMultiplier) ? cashOutMultiplier : 1.4;
  const band = CASH_OUT_TAX_BANDS[cashOutTaxRate] || CASH_OUT_TAX_BANDS.basic;
  const gross = modelHours * CASH_OUT_HOURLY_RATE * multiplier;
  const net = gross * (1 - band.deduction);
  const fmt = n => n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const grossEl = document.getElementById('cashout-gross');
  const netEl   = document.getElementById('cashout-net');
  const brkEl   = document.getElementById('cashout-breakdown');
  const noteEl  = document.getElementById('cashout-model-note');
  const cardEl  = document.getElementById('cashout-result-card');
  if (!grossEl) return;

  const note = cashOutModelNote(modelHours, payableHours);
  grossEl.textContent = '£' + fmt(gross);
  netEl.textContent = '£' + fmt(net);
  brkEl.textContent = cashOutBreakdown(modelHours, multiplier, band);
  if (noteEl) {
    noteEl.textContent = note;
    noteEl.classList.toggle('hidden', !note);
  }
  if (cardEl) cardEl.classList.toggle('cashout-result-modelled', !!note);
}

function buildCashOutSheet() {
  const bal = cumulativeBalance(state);
  const payableHours = Math.max(0, bal);
  // What the sheet is costing. Defaults to the payable balance; the engineer
  // can price any number of hours — "what would 40h be worth?" is the question
  // that makes a deficit worth climbing out of, and it cannot be asked of a
  // figure locked to what they have already banked.
  const modelHours = cashOutHours === null ? payableHours : cashOutHours;
  const isModelled = Math.abs(modelHours - payableHours) > 0.005;
  const multiplier = CASH_OUT_MULTIPLIERS.includes(cashOutMultiplier) ? cashOutMultiplier : 1.4;
  const band = CASH_OUT_TAX_BANDS[cashOutTaxRate] || CASH_OUT_TAX_BANDS.basic;
  const gross = modelHours * CASH_OUT_HOURLY_RATE * multiplier;
  const net = gross * (1 - band.deduction);
  const fmt = n => n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const multBtns = CASH_OUT_MULTIPLIERS.map(m => `
    <button class="cashout-mult-btn${m === multiplier ? ' active' : ''}" data-mult="${m}">${m}×</button>
  `).join('');

  const taxBtns = Object.entries(CASH_OUT_TAX_BANDS).map(([key, b]) => `
    <button class="cashout-tax-btn${key === cashOutTaxRate ? ' active' : ''}" data-tax="${key}">
      <span class="cashout-tax-label">${b.label}</span>
      <span class="cashout-tax-sub">${b.sub}</span>
    </button>
  `).join('');

  return `
    <div class="forecast-sheet${cashOutSheetOpen ? '' : ' hidden'}" id="cashout-sheet">
      <div class="forecast-backdrop" id="cashout-backdrop"></div>
      <div class="forecast-panel">
        <div class="forecast-handle"></div>
        <div class="forecast-header">
          <span class="forecast-title">CTAP Cash-Out</span>
          <button class="forecast-close" id="cashout-close">✕</button>
        </div>
        <div class="forecast-body">
          <div class="cashout-balance-row">
            <span class="cashout-balance-label">Payable balance</span>
            <span class="cashout-balance-val">${payableHours.toFixed(2)}h</span>
          </div>
          ${bal < 0 ? `<div class="cashout-deficit-note">Balance is ${bal.toFixed(2)}h in deficit — nothing to cash out yet. Price any figure below to see what climbing out is worth.</div>` : ''}

          <div class="cashout-section-label">Hours to price</div>
          <div class="cashout-hours-row">
            <button class="cashout-step-btn" id="cashout-minus" aria-label="One hour less">−</button>
            <div class="cashout-hours-wrap">
              <input type="number" id="cashout-hours-input" class="cashout-hours-input"
                     value="${modelHours.toFixed(2)}" min="0" max="999" step="0.5"
                     inputmode="decimal" aria-label="Hours to price">
              <span class="cashout-hours-unit">h</span>
            </div>
            <button class="cashout-step-btn" id="cashout-plus" aria-label="One hour more">+</button>
          </div>
          <div class="cashout-model-note${isModelled ? '' : ' hidden'}" id="cashout-model-note">
            ${isModelled ? cashOutModelNote(modelHours, payableHours) : ''}
          </div>

          <div class="cashout-section-label">Your multiplier</div>
          <div class="cashout-mult-row">${multBtns}</div>

          <div class="cashout-section-label">Tax band</div>
          <div class="cashout-tax-row">${taxBtns}</div>

          <div class="cashout-result-card${isModelled ? ' cashout-result-modelled' : ''}" id="cashout-result-card">
            <div class="cashout-result-row">
              <span class="cashout-result-label">Gross</span>
              <span class="cashout-result-val" id="cashout-gross">£${fmt(gross)}</span>
            </div>
            <div class="cashout-result-row cashout-result-net">
              <span class="cashout-result-label">Take-home (${band.label})</span>
              <span class="cashout-result-val cashout-result-net-val" id="cashout-net">£${fmt(net)}</span>
            </div>
            <div class="cashout-result-breakdown" id="cashout-breakdown">
              ${cashOutBreakdown(modelHours, multiplier, band)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openCashOutSheet() {
  cashOutSheetOpen = true;
  // Always open on what is actually payable. A modelled figure carried over
  // from last time would be read as a balance.
  cashOutHours = null;
  refreshSheetInPlace('cashout-sheet');
  document.getElementById('cashout-sheet').classList.remove('hidden');
}

function closeCashOutSheet() {
  cashOutSheetOpen = false;
  document.getElementById('cashout-sheet').classList.add('hidden');
  render();
}

function openForecastSheet() {
  forecastSheetOpen = true;
  dayEditMode = false;
  const todayKey = getTodayKey();
  const days = weekDays(currentWeekKey);
  activeDayKey = days.includes(todayKey) ? todayKey : days[0];
  // The sheet was drawn with the Dashboard, before a day was chosen, so it
  // would open on Monday. Bring its strip and day panel round to today.
  const sheet = document.getElementById('forecast-sheet');
  sheet.querySelectorAll('[data-strip-day]').forEach(b => {
    b.classList.toggle('dsp-active', b.dataset.stripDay === activeDayKey);
  });
  const wrap = sheet.querySelector('.day-detail-wrap');
  if (wrap) wrap.innerHTML = buildDayDetailPanel(currentWeekKey, state.weeks[currentWeekKey] || {}, activeDayKey, false);
  sheet.classList.remove('hidden');
}

function closeForecastSheet() {
  forecastSheetOpen = false;
  dayEditMode = false;
  document.getElementById('forecast-sheet').classList.add('hidden');
  render();
}

// Swap just the panel's inner content without touching the panel element itself,
// so the slideUp animation doesn't re-fire on every deletion.
function refreshSheetInPlace(sheetId) {
  const sheet = document.getElementById(sheetId);
  if (!sheet) return;
  const panel = sheet.querySelector('.forecast-panel');
  if (!panel) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = sheetId === 'forecast-sheet'
    ? buildWeekForecastSheet()
    : sheetId === 'cashout-sheet'
      ? buildCashOutSheet()
      : buildWeekSummarySheet();
  const newPanel = tmp.querySelector('.forecast-panel');
  if (!newPanel) return;
  const scrollTop = panel.scrollTop;
  panel.innerHTML = newPanel.innerHTML;
  panel.scrollTop = scrollTop;
}

// ── Voice logging ──────────────────────────────────────────────────────────
// Speak a day's work, confirm what was heard, log it in one go. Parsing lives
// in data.cjs (parseVoiceLog); everything here is capture and confirmation.
// Nothing reaches state until the engineer taps "Log all" — see ADR-0007.

const VOICE_CATEGORY_LABELS = { core: 'Gas', hive: 'Hive', sales: 'SGO', absent: 'Absence' };

// How to talk to it. "Four repairs" works, but a repair could be a boiler, a
// cooker or a fire at different credit — so the sheet leads with naming the
// appliance, which is the one habit that removes most of the corrections.
const VOICE_TIPS = [
  { say: 'four boiler repairs', why: 'Name the appliance — “four repairs” is guessed' },
  { say: 'two hive wireless thermostats', why: 'Say which Hive — “hive install” is guessed' },
  { say: 'six breakdowns, two boiler leads', why: 'String jobs together, count first' },
  { say: 'a cooker service and two fires', why: '“a” counts as one' },
  { say: 'trace and repair forty five minutes', why: 'Give a time for min-for-min jobs' },
  { say: 'two hours wait work', why: 'Wait work and NPT take a time too' },
  { say: 'yesterday I did four services', why: 'Backdate by saying the day' },
  { say: 'Monday six breakdowns, Tuesday three services', why: 'Do a whole week in one go' }
];

function buildVoiceTipsHTML(open) {
  const rows = VOICE_TIPS.map(t => `
    <div class="voice-tip">
      <span class="voice-tip-say">“${t.say}”</span>
      <span class="voice-tip-why">${t.why}</span>
    </div>`).join('');
  return `
    <details class="voice-tips"${open ? ' open' : ''}>
      <summary>How to say it</summary>
      <div class="voice-tips-body">${rows}</div>
    </details>`;
}

function voiceJobOptions(selectedId) {
  return Object.keys(JOB_TYPES).map(function(cat) {
    const opts = JOB_TYPES[cat].map(function(j) {
      const meta = JOB_META[j.id] || {};
      const label = meta.short ? meta.short + (meta.sub ? ' · ' + meta.sub : '') : j.name;
      return `<option value="${j.id}"${j.id === selectedId ? ' selected' : ''}>${label}</option>`;
    }).join('');
    return `<optgroup label="${VOICE_CATEGORY_LABELS[cat] || cat}">${opts}</optgroup>`;
  }).join('');
}

function voiceDayBounds() {
  const weekKeys = Object.keys(state.weeks || {}).sort();
  const min = weekKeys.length > 0
    ? weekKeys[0]
    : (function() { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return localDateStr(d); })();
  return { min: min, max: getTodayKey() };
}

function buildVoiceItemRow(item, idx) {
  const job = item.job || findJob(item.jobId);
  if (!job) return '';
  const isDayFlag = job.isMentorFull || job.isMentorPartial;
  const creditMins = voiceEntryCreditMins(job, item.value) * item.qty;

  const creditText = job.isNpt
    ? (item.value ? `−${item.value} min` : 'needs time')
    : isDayFlag
      ? (job.isMentorFull ? 'Full day' : '−20% target')
      : item.needsValue
        ? 'needs time'
        : `+${(creditMins / 60).toFixed(2)}h`;

  const valueUnit = job.variableType === 'hours' ? 'hrs' : 'mins';
  const valueField = job.variable ? `
    <div class="voice-item-value">
      <input type="number" inputmode="decimal" step="any" min="0"
        class="voice-value-input${item.needsValue ? ' needs' : ''}"
        data-idx="${idx}" value="${item.value === null ? '' : item.value}"
        placeholder="—" aria-label="${job.variablePrompt || 'Value'}">
      <span class="voice-value-unit">${valueUnit}</span>
    </div>` : '';

  const qtyStepper = isDayFlag ? '' : `
    <div class="voice-qty">
      <button class="voice-qty-btn" data-voice-qty="-1" data-idx="${idx}" aria-label="One fewer">−</button>
      <span class="voice-qty-val">${item.qty}</span>
      <button class="voice-qty-btn" data-voice-qty="1" data-idx="${idx}" aria-label="One more">+</button>
    </div>`;

  return `
    <div class="voice-item${item.needsValue ? ' needs-value' : ''}${item.assumed ? ' assumed' : ''}">
      <div class="voice-item-main">
        <select class="voice-job-select" data-idx="${idx}" aria-label="Job type">${voiceJobOptions(item.jobId)}</select>
        <button class="voice-item-remove" data-voice-remove="${idx}" aria-label="Remove">✕</button>
      </div>
      ${item.assumed ? `<div class="voice-item-assumed">${/^hive\b/.test(item.phrase)
        ? voiceAssumedHint(item.phrase)
        : `Guessed from “${item.phrase}” — ${voiceAssumedHint(item.phrase)}`}</div>` : ''}
      <div class="voice-item-foot">
        ${qtyStepper}
        ${valueField}
        <span class="voice-item-credit${item.needsValue ? ' needs' : ''}">${creditText}</span>
      </div>
    </div>`;
}

function buildVoiceBody() {
  if (voiceStatus === 'listening') {
    const heard = voiceHeard();
    return `
      <div class="voice-listening">
        <button class="voice-mic-pulse" id="voice-mic-again" aria-label="Start again">${iconMic()}</button>
        <div class="voice-listening-label">Listening…</div>
        <div class="voice-live-transcript${heard ? '' : ' empty'}" id="voice-live">${heard || 'Say what you’ve done today'}</div>
        <div class="voice-listening-hint">Take your time — it waits while you think. Tap the mic to start again, or Done when you’ve finished.</div>
        <button class="voice-primary-btn" id="voice-stop">Done</button>
        <button class="voice-link-btn" id="voice-type-instead">Type it instead</button>
        ${buildVoiceTipsHTML(false)}
      </div>`;
  }

  if (voiceStatus === 'typing' || voiceStatus === 'error') {
    return `
      <div class="voice-typing">
        ${voiceMessage ? `<div class="voice-message">${voiceMessage}</div>` : ''}
        ${voiceStatus === 'typing' && speechRecognitionCtor()
          ? `<button class="voice-mic-again" id="voice-listen-again">${iconMic()}<span>Try again</span></button>`
          : ''}
        <label class="voice-type-label" for="voice-text">What did you do?</label>
        <textarea id="voice-text" class="voice-textarea" rows="3"
          placeholder="e.g. six breakdowns, two boiler leads and three fires">${voiceTranscript}</textarea>
        <div class="voice-type-hint">Tip: your keyboard’s microphone key works here too.</div>
        <button class="voice-primary-btn" id="voice-parse-text">Read that back</button>
        ${buildVoiceTipsHTML(true)}
      </div>`;
  }

  if (voiceStatus === 'parsed' && voiceDraft) {
    const items = voiceDraft.items;
    const bounds = voiceDayBounds();
    const dayDate = new Date(voiceDraft.dayKey + 'T00:00:00');
    const isToday = voiceDraft.dayKey === getTodayKey();
    const dayLabelText = isToday
      ? 'Today · ' + dayDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
      : dayDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    if (items.length === 0) {
      return `
        <div class="voice-empty">
          ${voiceTranscript ? `<div class="voice-heard">“${voiceTranscript}”</div>` : ''}
          <div class="voice-empty-msg">Couldn’t pick out any jobs from that.</div>
          ${voiceDraft.unmatched.length > 0
            ? `<div class="voice-unmatched-list">${voiceDraft.unmatched.map(u => `<span class="voice-unmatched-chip">${u}</span>`).join('')}</div>`
            : ''}
          <button class="voice-primary-btn" id="voice-retry">Try again</button>
          <button class="voice-link-btn" id="voice-type-instead">Type it instead</button>
        </div>`;
    }

    const totalHours = voiceBatchCreditHours(items);
    const totalCount = items.reduce(function(s, it) {
      const job = it.job || findJob(it.jobId);
      return s + ((job && (job.isMentorFull || job.isMentorPartial)) ? 0 : it.qty);
    }, 0);
    const blocked = items.some(function(it) { return it.needsValue; });

    // A whole week read back in one go arrives as several days. Grouping them
    // under their own headers is what makes the draft checkable — a flat list
    // of nineteen jobs with no day showing is not something anyone can confirm.
    // The row index stays a flat index into voiceDraft.items, so every existing
    // per-row control keeps working untouched.
    const days = voiceDraftDays();
    const multiDay = days.length > 1;

    const dayHeader = (dk) => {
      const dd = new Date(dk + 'T00:00:00');
      const isTodayGroup = dk === getTodayKey();
      const label = isTodayGroup
        ? 'Today · ' + dd.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        : dd.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
      return `
        <div class="voice-day-row voice-day-row-group">
          <button class="voice-day-btn" data-voice-day-shift="-1" data-day="${dk}"
            ${dk <= bounds.min ? 'disabled' : ''} aria-label="Previous day">&#8249;</button>
          <span class="voice-day-label${isTodayGroup ? ' today' : ''}">${label}</span>
          <button class="voice-day-btn" data-voice-day-shift="1" data-day="${dk}"
            ${dk >= bounds.max ? 'disabled' : ''} aria-label="Next day">&#8250;</button>
        </div>`;
    };

    const itemsHTML = multiDay
      ? days.map(dk => {
          const rows = items
            .map((it, idx) => ({ it, idx }))
            .filter(r => (r.it.dayKey || voiceDraft.dayKey) === dk);
          const dayHours = voiceBatchCreditHours(rows.map(r => r.it));
          return `
            <div class="voice-day-group">
              ${dayHeader(dk)}
              <div class="voice-items">${rows.map(r => buildVoiceItemRow(r.it, r.idx)).join('')}</div>
              <div class="voice-day-subtotal">+${dayHours.toFixed(2)}h</div>
            </div>`;
        }).join('')
      : `
        <div class="voice-day-row">
          <button class="voice-day-btn" id="voice-day-prev" ${voiceDraft.dayKey <= bounds.min ? 'disabled' : ''} aria-label="Previous day">&#8249;</button>
          <span class="voice-day-label${isToday ? ' today' : ''}">${dayLabelText}</span>
          <button class="voice-day-btn" id="voice-day-next" ${voiceDraft.dayKey >= bounds.max ? 'disabled' : ''} aria-label="Next day">&#8250;</button>
        </div>
        <div class="voice-items">${items.map(buildVoiceItemRow).join('')}</div>`;

    return `
      <div class="voice-review">
        ${voiceTranscript ? `<div class="voice-heard">“${voiceTranscript}”</div>` : ''}

        ${itemsHTML}

        ${voiceDraft.unmatched.length > 0 ? `
          <div class="voice-unmatched">
            <span class="voice-unmatched-label">Not recognised</span>
            <div class="voice-unmatched-list">${voiceDraft.unmatched.map(u => `<span class="voice-unmatched-chip">${u}</span>`).join('')}</div>
          </div>` : ''}

        <div class="voice-total-row">
          <span class="voice-total-label">${totalCount} entr${totalCount === 1 ? 'y' : 'ies'}${multiDay ? ` · ${days.length} days` : ''}</span>
          <span class="voice-total-val">+${totalHours.toFixed(2)}h</span>
        </div>

        ${blocked ? `<div class="voice-blocked-note">Add a time to the highlighted rows before logging.</div>` : ''}

        <div class="voice-actions">
          <button class="voice-secondary-btn" id="voice-discard">Discard</button>
          <button class="voice-primary-btn" id="voice-commit" ${blocked ? 'disabled' : ''}>Log ${totalCount}</button>
        </div>
        <button class="voice-link-btn" id="voice-retry">Start over</button>
        ${buildVoiceTipsHTML(false)}
      </div>`;
  }

  return '';
}

function buildVoiceSheet() {
  return `
    <div class="forecast-sheet voice-sheet${voiceSheetOpen ? '' : ' hidden'}" id="voice-sheet">
      <div class="forecast-backdrop" id="voice-backdrop"></div>
      <div class="forecast-panel">
        <div class="forecast-handle"></div>
        <div class="forecast-header">
          <span class="forecast-title">Voice log</span>
          <button class="forecast-close" id="voice-close">✕</button>
        </div>
        <div class="forecast-body">${buildVoiceBody()}</div>
      </div>
    </div>`;
}

// Swap only the sheet body, so the panel doesn't re-animate and any open
// keyboard stays put while the engineer edits rows.
function refreshVoiceSheet() {
  const body = document.querySelector('#voice-sheet .forecast-body');
  if (!body) { render(); return; }
  body.innerHTML = buildVoiceBody();
  attachVoiceSheetListeners();
}

function openVoiceSheet() {
  voiceSheetOpen = true;
  voiceTranscript = '';
  voiceDraft = null;
  voiceMessage = '';
  const sheet = document.getElementById('voice-sheet');
  if (sheet) sheet.classList.remove('hidden');
  startVoiceCapture();
}

function closeVoiceSheet() {
  stopVoiceCapture();
  voiceSheetOpen = false;
  voiceStatus = 'idle';
  voiceTranscript = '';
  voiceDraft = null;
  voiceMessage = '';
  const sheet = document.getElementById('voice-sheet');
  if (sheet) sheet.classList.add('hidden');
  render();
}

function speechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// One recogniser per sheet, and we always end it — never the engine.
//
// Measured on an iPhone with voice-lab.html (iOS 18.7): once a session has
// heard speech, the next session is deaf — whether the first ended on its own
// or by our abort(), and however long the gap (0.25s, 1s, 21s all failed). A
// deaf session fails about 40 seconds after it starts ("Source is stopped"),
// and only a start after that failure hears again. Every design that restarts
// the engine between dictations therefore hears the first one and nothing
// after it, which is exactly what Jake found with Try again.
//
// So the restart is the thing to avoid:
//   1. continuous = true, and ONE session for as long as the sheet is open. It
//      carries the pauses an engineer takes between jobs (three phrases with
//      pauses held on the phone).
//   2. Done, the silence guard and the cap on a dictation parse what was heard
//      and MUTE the session: results still arrive and are discarded. Start
//      over, Try again and the mic unmute it and listen from that point. None
//      of them touch the engine.
//   3. It ends by our abort(): closing the sheet, logging or discarding the
//      draft, or the ceiling on one session. If the engine ends on its own we
//      keep what was heard and wait for the next tap, which starts fresh and
//      takes its chances; a start that turns out deaf is retried once when
//      iOS reports it.
//   4. Timers we own stay the backstop for the listening state: an engine that
//      never starts, goes quiet or runs on is handled without it.
const VOICE_START_TIMEOUT = 4000;    // engine never got going
const VOICE_SILENCE_TIMEOUT = 7000;  // no NEW speech for this long → wrap up
const VOICE_MAX_SESSION = 120000;    // ceiling on one engine session, muted or not
const VOICE_ALTERNATIVES = 3;        // readings to ask the engine for per phrase

function clearVoiceListenTimers() {
  if (_voiceStartGuard) { clearTimeout(_voiceStartGuard); _voiceStartGuard = null; }
  if (_voiceSilenceGuard) { clearTimeout(_voiceSilenceGuard); _voiceSilenceGuard = null; }
}

function clearVoiceTimers() {
  clearVoiceListenTimers();
  if (_voiceMaxTimer) { clearTimeout(_voiceMaxTimer); _voiceMaxTimer = null; }
}

// Everything heard so far, including the phrase in progress.
function voiceHeard() {
  return (_voiceCommitted + ' ' + _voiceInterim).replace(/\s+/g, ' ').trim();
}

function paintVoiceTranscript() {
  const live = document.getElementById('voice-live');
  if (!live) return;
  const heard = voiceHeard();
  live.textContent = heard || 'Say what you’ve done today';
  live.classList.toggle('empty', !heard);
}

function armVoiceSilenceGuard() {
  if (_voiceSilenceGuard) clearTimeout(_voiceSilenceGuard);
  _voiceSilenceGuard = setTimeout(function() {
    _voiceSilenceGuard = null;
    if (voiceStatus === 'listening') finishVoiceCapture();
  }, VOICE_SILENCE_TIMEOUT);
}

// Single exit from listening, whether a timer did it or the engineer tapped
// Done. The session stays open and muted; only the sheet moves on.
function finishVoiceCapture() {
  clearVoiceListenTimers();
  const heard = voiceHeard();
  voiceTranscript = heard;
  if (heard.trim()) {
    parseVoiceInput(heard);
  } else {
    voiceStatus = 'typing';
    voiceMessage = 'Didn’t catch anything — try again, or type it below.';
    refreshVoiceSheet();
  }
}

// Listen on the session that is already open: drop what was heard, and ignore
// any phrase the engine was part-way through, should it finalise late.
function listenVoiceAgain() {
  voiceTranscript = '';
  _voiceCommitted = '';
  _voiceInterim = '';
  _voiceResultFloor = _voiceSeenResults;
  voiceStatus = 'listening';
  voiceMessage = '';
  refreshVoiceSheet();
  armVoiceSilenceGuard();
}

// The readings the engine offers for one phrase, best first by its own lights.
function voiceAlternatives(result) {
  const out = [];
  for (let k = 0; k < result.length; k++) out.push(result[k].transcript);
  return out;
}

function buildRecognition() {
  const SR = speechRecognitionCtor();
  const rec = new SR();
  rec.lang = 'en-GB';
  rec.interimResults = true;
  rec.continuous = true;
  // The engine ranks its readings by how much like English they sound, which
  // hears "six breakdowns" as "six bank accounts". Given a few, the job
  // vocabulary picks; see bestVoiceAlternative.
  rec.maxAlternatives = VOICE_ALTERNATIVES;

  rec.onstart = function() {
    if (_voiceStartGuard) { clearTimeout(_voiceStartGuard); _voiceStartGuard = null; }
    if (voiceStatus === 'listening') armVoiceSilenceGuard();
  };
  rec.onspeechstart = function() { if (voiceStatus === 'listening') armVoiceSilenceGuard(); };
  rec.onaudiostart = rec.onspeechstart;

  rec.onresult = function(e) {
    _voiceSeenResults = e.results.length;
    if (voiceStatus !== 'listening') return;          // muted: the sheet has moved on
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (i < _voiceResultFloor) continue;            // from before Start over
      const text = bestVoiceAlternative(voiceAlternatives(e.results[i]));
      if (e.results[i].isFinal) _voiceCommitted = (_voiceCommitted + ' ' + text).replace(/\s+/g, ' ').trim();
      else interim += text + ' ';
    }
    _voiceInterim = interim.trim();
    paintVoiceTranscript();
    // Still talking — push the silence guard back out.
    armVoiceSilenceGuard();
  };

  rec.onerror = function(e) {
    if (e.error === 'aborted') return;              // we stopped it deliberately
    // Nothing heard yet is just a long pause; our silence guard decides.
    if (e.error === 'no-speech') return;
    clearVoiceTimers();
    _recognition = null;
    // A muted session failing changes nothing the engineer can see; the next
    // tap of the mic starts fresh.
    if (voiceStatus !== 'listening') return;
    const blocked = e.error === 'not-allowed' || e.error === 'service-not-allowed';
    if (!blocked && voiceHeard()) { finishVoiceCapture(); return; }
    // iOS reports a deaf session this way, ~40s in — and the start after that
    // report is the one that hears. One retry, so a phone that is genuinely
    // without a microphone doesn't loop.
    if (e.error === 'audio-capture' && _voiceDeafRetries < 1) {
      _voiceDeafRetries++;
      startVoiceCapture();
      return;
    }
    voiceStatus = blocked ? 'error' : 'typing';
    voiceMessage = blocked
      ? 'Microphone access was blocked. Allow it in Settings, or type it below.'
      : 'Voice capture failed. You can type it instead.';
    refreshVoiceSheet();
  };

  // Every session we end goes through stopVoiceCapture, which detaches this
  // handler before abort(). Reaching here means the engine stopped on its own.
  // Keep what was heard; never restart — the next tap does that.
  rec.onend = function() {
    clearVoiceTimers();
    _recognition = null;
    if (voiceStatus !== 'listening') return;        // muted: nothing to wrap up
    _voiceCommitted = (_voiceCommitted + ' ' + _voiceInterim).replace(/\s+/g, ' ').trim();
    _voiceInterim = '';
    finishVoiceCapture();
  };

  return rec;
}

function startVoiceCapture() {
  const SR = speechRecognitionCtor();
  if (!SR) {
    // Safari in standalone PWA mode is the common case here — the keyboard's
    // own dictation key still works in the textarea fallback.
    voiceStatus = 'typing';
    voiceMessage = 'Voice capture isn’t available on this device.';
    refreshVoiceSheet();
    return;
  }

  // A session is already open: listen on it. This is the whole fix for
  // Try again — see the note above buildRecognition.
  if (_recognition) { listenVoiceAgain(); return; }

  const voiceStartFailed = function() {
    clearVoiceTimers();
    _recognition = null;
    voiceStatus = 'typing';
    voiceMessage = 'Voice capture failed to start. You can type it instead.';
    refreshVoiceSheet();
  };

  try {
    voiceTranscript = '';
    _voiceCommitted = '';
    _voiceInterim = '';
    _voiceSeenResults = 0;
    _voiceResultFloor = 0;

    voiceStatus = 'listening';
    voiceMessage = '';
    refreshVoiceSheet();

    // Armed before start() — onstart can fire synchronously and clears this,
    // so arming afterwards would leave a live timer that kills a healthy
    // session a few seconds in.
    _voiceStartGuard = setTimeout(function() {
      _voiceStartGuard = null;
      if (voiceStatus !== 'listening') return;
      stopVoiceCapture();
      voiceStatus = 'typing';
      voiceMessage = 'Voice capture didn’t start on this device — type it below instead.';
      refreshVoiceSheet();
    }, VOICE_START_TIMEOUT);

    // However long the sheet stays up, one session can't hold the microphone
    // forever. Past the ceiling the next tap starts fresh.
    _voiceMaxTimer = setTimeout(function() {
      _voiceMaxTimer = null;
      const wasListening = voiceStatus === 'listening';
      stopVoiceCapture();
      if (wasListening) finishVoiceCapture();
    }, VOICE_MAX_SESSION);

    _recognition = buildRecognition();
    _recognition.start();
  } catch (err) {
    voiceStartFailed();
  }
}

function stopVoiceCapture() {
  clearVoiceTimers();
  _voiceDeafRetries = 0;
  if (!_recognition) return;
  const rec = _recognition;
  _recognition = null;
  try {
    rec.onend = null; rec.onresult = null; rec.onerror = null;
    rec.onstart = null; rec.onspeechstart = null; rec.onaudiostart = null;
    // abort() drops the audio immediately; stop() waits for a final result and
    // can hang on iOS, which is the trap we're avoiding.
    if (rec.abort) rec.abort(); else rec.stop();
  } catch (e) {}
}

function parseVoiceInput(text) {
  voiceTranscript = String(text || '').trim();
  voiceDraft = parseVoiceLog(voiceTranscript, getTodayKey());
  voiceStatus = 'parsed';
  voiceMessage = '';
  refreshVoiceSheet();
}

// Move one day's worth of entries. With a single day in the draft this is the
// old whole-draft stepper; with several it moves just that group, so a misheard
// "Tuesday" can be corrected without disturbing the rest of the week.
function shiftVoiceDay(delta, fromDay) {
  if (!voiceDraft) return;
  const bounds = voiceDayBounds();
  const source = fromDay || voiceDraft.dayKey;
  const d = new Date(source + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  const next = localDateStr(d);
  if (next < bounds.min || next > bounds.max) return;
  // Landing on a day already in the draft would silently merge two groups.
  if (voiceDraftDays().indexOf(next) !== -1) return;

  voiceDraft.items.forEach(function(it) {
    if ((it.dayKey || voiceDraft.dayKey) === source) it.dayKey = next;
  });
  if (voiceDraft.dayKey === source) voiceDraft.dayKey = next;
  refreshVoiceSheet();
}

// Every distinct day in the draft, earliest first. One entry for a single-day
// dictation, several when a whole week was read back in one go.
function voiceDraftDays() {
  if (!voiceDraft) return [];
  const days = [];
  voiceDraft.items.forEach(function(it) {
    const dk = it.dayKey || voiceDraft.dayKey;
    if (days.indexOf(dk) === -1) days.push(dk);
  });
  return days.sort();
}

// Write a confirmed batch in one go, rather than one write per entry as the
// tile flow does. A week read back on a Monday can straddle two weeks.
function commitVoiceBatch() {
  if (!voiceDraft || voiceDraft.items.length === 0) return;

  const days = voiceDraftDays();
  const todayKey = getTodayKey();
  if (days.some(function(dk) { return dk > todayKey; })) {
    showToast('Cannot log to a future date');
    return;
  }
  if (voiceDraft.items.some(function(it) { return it.needsValue; })) {
    showToast('Add a time to the highlighted rows');
    return;
  }

  const weeksTouched = [];
  let logged = 0;
  let creditMinsTotal = 0;

  voiceDraft.items.forEach(function(it) {
    const job = it.job || findJob(it.jobId);
    if (!job) return;

    const targetDay = it.dayKey || voiceDraft.dayKey;
    const targetWeekKey = getWeekKey(new Date(targetDay + 'T00:00:00'));
    const week = getOrCreateWeek(state, targetWeekKey);
    if (weeksTouched.indexOf(targetWeekKey) === -1) weeksTouched.push(targetWeekKey);

    if (job.isMentorFull || job.isMentorPartial) {
      if (!week.mentorDays) week.mentorDays = {};
      week.mentorDays[targetDay] = job.isMentorFull ? 'full' : 'partial';
      logged++;
      return;
    }

    if (job.isNpt) {
      const mins = Math.round(it.value || 0);
      if (mins <= 0) return;
      if (!week.deductionLog) week.deductionLog = [];
      for (let n = 0; n < it.qty; n++) {
        week.deductionLog.push({ name: job.name, mins: mins, date: targetDay });
        week.deductionMins = (week.deductionMins || 0) + mins;
        logged++;
      }
      return;
    }

    const creditMins = voiceEntryCreditMins(job, it.value);
    const variableDisplay = job.variable && it.value !== null
      ? (job.variableType === 'hours' ? it.value + 'h' : it.value + 'min')
      : null;
    const day = getOrCreateDay(week, targetDay);
    for (let n = 0; n < it.qty; n++) {
      day.push({
        id: job.id,
        name: job.name,
        creditMins: creditMins,
        variableInput: variableDisplay,
        ts: Date.now()
      });
      logged++;
      creditMinsTotal += creditMins;
    }
  });

  saveState(state);
  if (window.__ctapSyncWeek) weeksTouched.forEach(function(wk) { window.__ctapSyncWeek(wk); });

  const lastDay = days[days.length - 1];
  const spread = days.length > 1
    ? ` across ${days.length} days`
    : (lastDay !== todayKey ? ' (backdated)' : '');
  showToast(`${logged} entr${logged === 1 ? 'y' : 'ies'} added · +${(creditMinsTotal / 60).toFixed(2)}h${spread}`);

  // Land the engineer on the last day they logged to.
  setLogDay(lastDay);
  closeVoiceSheet();
}

// Bound on every sheet-body refresh, so it must be idempotent — the body is
// replaced wholesale, which discards the previous listeners with it.
function attachVoiceSheetListeners() {
  const body = document.querySelector('#voice-sheet .forecast-body');
  if (!body) return;

  const on = function(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  };

  on('voice-stop', finishVoiceCapture);
  // The mic means "listen again", wherever it appears. Done is the way to
  // finish; the timers we own are what guarantee listening can always end.
  on('voice-mic-again', startVoiceCapture);
  on('voice-listen-again', startVoiceCapture);

  on('voice-type-instead', function() {
    // The session stays open, muted, so a Try again from here needs no restart.
    clearVoiceListenTimers();
    voiceStatus = 'typing';
    voiceMessage = '';
    refreshVoiceSheet();
    const ta = document.getElementById('voice-text');
    if (ta) ta.focus();
  });

  on('voice-parse-text', function() {
    const ta = document.getElementById('voice-text');
    parseVoiceInput(ta ? ta.value : '');
  });

  on('voice-retry', function() { startVoiceCapture(); });
  on('voice-discard', closeVoiceSheet);
  on('voice-commit', commitVoiceBatch);
  on('voice-day-prev', function() { shiftVoiceDay(-1); });
  on('voice-day-next', function() { shiftVoiceDay(1); });

  // Per-day steppers, when a whole week was read back at once.
  body.querySelectorAll('[data-voice-day-shift]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      shiftVoiceDay(Number(btn.dataset.voiceDayShift), btn.dataset.day);
    });
  });

  if (!voiceDraft) return;

  body.querySelectorAll('[data-voice-qty]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const idx = parseInt(btn.dataset.idx, 10);
      const delta = parseInt(btn.dataset.voiceQty, 10);
      const item = voiceDraft.items[idx];
      if (!item) return;
      item.qty = Math.max(1, item.qty + delta);
      refreshVoiceSheet();
    });
  });

  body.querySelectorAll('[data-voice-remove]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const idx = parseInt(btn.dataset.voiceRemove, 10);
      voiceDraft.items.splice(idx, 1);
      refreshVoiceSheet();
    });
  });

  // Correcting a mis-heard job: swapping to a variable job needs a value, and
  // swapping away from one clears the stale figure.
  body.querySelectorAll('.voice-job-select').forEach(function(sel) {
    sel.addEventListener('change', function() {
      const idx = parseInt(sel.dataset.idx, 10);
      const item = voiceDraft.items[idx];
      const job = findJob(sel.value);
      if (!item || !job) return;
      item.jobId = job.id;
      item.job = job;
      if (!job.variable) { item.value = null; item.needsValue = false; }
      else item.needsValue = item.value === null;
      item.assumed = false;
      refreshVoiceSheet();
    });
  });

  body.querySelectorAll('.voice-value-input').forEach(function(input) {
    const apply = function() {
      const idx = parseInt(input.dataset.idx, 10);
      const item = voiceDraft.items[idx];
      if (!item) return;
      const raw = parseFloat(input.value);
      item.value = isNaN(raw) || raw <= 0 ? null : raw;
      item.needsValue = item.value === null;
    };
    // Update the model as they type, but only redraw on commit so the field
    // keeps focus and the keyboard stays open.
    input.addEventListener('input', apply);
    input.addEventListener('change', function() { apply(); refreshVoiceSheet(); });
  });
}

// ── Daily check-in ─────────────────────────────────────────────────────────
// A diary the engineer keeps for themselves. Nobody else can read it, nothing
// here compares them to another engineer, and no surface draws a conclusion on
// their behalf. See ADR-0012 before adding anything that says "because".

// ── First run ──────────────────────────────────────────────────────────────
// Ten engineers install this on the same Monday, and each of them arrives with a
// CTAP balance they have been carrying for months. The app defaults that balance
// to zero and looks completely finished while it does — sane 40h/80% defaults,
// every figure rendered, nothing obviously blank. So the one setting that makes
// the headline number theirs rather than fictional is also the one with no
// prompt to set it, and the explanation of all this sits collapsed at the bottom
// of Settings under HELP, below the thing it explains.
//
// Hence a card that says what is left to do and goes away when it's done. Not a
// launch modal: a modal is dismissed to get at the app, which teaches the
// engineer to dismiss it, and it interrupts the one engineer who set everything
// up on Friday. This waits on the dashboard and disappears on its own.
const SETUP_DISMISSED_KEY = 'jcpd_setup_dismissed';
const HOWTO_SEEN_KEY = 'jcpd_howto_seen';

function setupSteps() {
  const wk = state.weeks[getWeekKey(new Date())] || {};
  const shifts = wk.shifts || {};
  return [
    {
      id: 'balance',
      // Touched at all, including deliberately to zero — an engineer who is
      // genuinely level has still answered the question.
      done: Object.prototype.hasOwnProperty.call(state, 'startingBalance'),
      label: 'Set your starting CTAP balance',
      hint: 'The hours you are already up or down, so the balance is yours',
    },
    {
      id: 'shifts',
      done: Object.keys(shifts).some(dk => shifts[dk] && (shifts[dk].start || shifts[dk].leave)),
      label: 'Put in this week\'s shifts',
      hint: 'Tap Standard week if it is a normal Mon–Fri',
    },
    {
      id: 'howto',
      done: localStorage.getItem(HOWTO_SEEN_KEY) === 'true',
      label: 'Read how the app works',
      hint: 'Two minutes, and it covers where your data lives',
    },
  ];
}

function buildSetupCard() {
  if (localStorage.getItem(SETUP_DISMISSED_KEY) === 'true') return '';
  const steps = setupSteps();
  const left = steps.filter(st => !st.done).length;
  if (!left) return '';

  return `<div class="setup-card">
    <div class="setup-card-top">
      <span class="setup-card-label">Set up</span>
      <span class="setup-card-count">${left} left</span>
      <button class="setup-card-close" id="setup-dismiss" aria-label="Hide setup">×</button>
    </div>
    ${steps.map(st => `
      <button class="setup-step${st.done ? ' is-done' : ''}" data-setup-step="${st.id}"${st.done ? ' disabled' : ''}>
        <span class="setup-step-mark" aria-hidden="true">${st.done ? '✓' : ''}</span>
        <span class="setup-step-txt">
          <strong>${st.label}</strong>
          <small>${st.hint}</small>
        </span>
        ${st.done ? '' : '<span class="setup-step-go">›</span>'}
      </button>`).join('')}
  </div>`;
}

function buildCheckinCard() {
  if (!isCheckinOn()) return '';
  const todayKey = getTodayKey();
  const entry = getCheckin(state, todayKey);
  const done = !checkinIsEmpty(entry);

  if (done) {
    const count = checkinAnsweredCount(entry);
    return `
      <button class="checkin-card checkin-card-done" id="checkin-open">
        <span class="checkin-card-tick">✓</span>
        <span class="checkin-card-txt">
          <strong>Checked in today</strong>
          <small>${count} ${count === 1 ? 'answer' : 'answers'} — tap to change</small>
        </span>
      </button>`;
  }

  const q = growQuestionForDay(todayKey);
  const stage = findGrowStage(q.stage);
  const goal = getWeekGoal(state, getWeekKey(new Date()));
  return `
    <button class="checkin-card" id="checkin-open">
      <span class="checkin-card-txt">
        <strong>${stage.label}${goal ? '' : ' — set this week\'s goal'}</strong>
        <small>${goal ? q.text : 'What do you want to be different about this week?'}</small>
      </span>
      <span class="checkin-card-go">Under a minute ›</span>
    </button>`;
}

// ── Reality, stated and not interpreted ────────────────────────────────────
// The engineer's own week, in figures. This is the stage the app can genuinely
// answer, and answering it is the accountability: what you've done, how many
// jobs, where you fall short. No adjectives, no verdict, no "you should" — the
// numbers sit there and the engineer says what they mean.
function buildRealityPanel(dk) {
  const wkKey = getWeekKey(new Date(dk + 'T00:00:00'));
  const week = state.weeks[wkKey] || { days: {} };
  const earned = weekCreditHours(week);
  const target = weekTargetHours(state, wkKey);
  const gap = target - earned;
  const jobs = Object.values(week.days || {}).reduce((s, arr) => s + arr.length, 0);
  const npt = (week.deductionMins || 0) / 60;

  const cell = (label, value, cls) =>
    `<div class="reality-cell"><div class="reality-label">${label}</div>
      <div class="reality-value${cls ? ' ' + cls : ''}">${value}</div></div>`;

  // "TO GO", not "SHORT BY". On a Tuesday the whole week's target is still
  // ahead of you — labelling the arithmetic as a shortfall passes a verdict on
  // a week that has barely started, which is the one thing Reality must not do.
  // Only "AHEAD" carries a colour, because being ahead is a fact rather than a
  // warning; an amber "to go" would read as the app tutting at you.
  return `
    <div class="reality-panel">
      <div class="reality-head">Your week so far</div>
      <div class="reality-grid">
        ${cell('EARNED', earned.toFixed(2) + 'h')}
        ${cell('WEEK TARGET', target.toFixed(2) + 'h')}
        ${gap > 0
          ? cell('TO GO', gap.toFixed(2) + 'h')
          : cell('AHEAD', Math.abs(gap).toFixed(2) + 'h', 'green')}
        ${cell('JOBS', String(jobs))}
        ${npt > 0 ? cell('NPT', npt.toFixed(2) + 'h') : ''}
      </div>
    </div>`;
}

// ── Goal picker (Monday, or any day without a goal set) ────────────────────
// Five suggestions and a blank line. The app never picks — a goal handed to
// someone is the employer's target with a friendlier font.
function buildGoalPicker(draft) {
  const chosen = draft.goalFactorTag;
  const custom = draft.goalCustom || '';
  return `
    <div class="checkin-factor">
      <div class="checkin-factor-ask">What do you want to be different about this week?</div>
      <div class="goal-options">
        ${CHECKIN_FACTORS.map(f => `
          <button class="goal-opt${chosen === f.tag && !custom ? ' selected' : ''}"
            data-goal-factor="${f.tag}" aria-pressed="${chosen === f.tag && !custom}">
            <span class="goal-opt-label">${f.label}</span>
            <span class="goal-opt-goal">${f.goal}</span>
          </button>`).join('')}
      </div>
      <input type="text" id="goal-custom" class="goal-custom" maxlength="${CHECKIN_GOAL_MAX}"
        placeholder="…or write your own" value="${custom.replace(/"/g, '&quot;')}">
    </div>`;
}

function buildCheckinBody() {
  const dk = checkinDayKey || getTodayKey();
  const wkKey = getWeekKey(new Date(dk + 'T00:00:00'));
  const draft = checkinDraft || { ratings: {}, note: '' };
  const q = growQuestionForDay(dk);
  const stage = findGrowStage(q.stage);
  const warning = checkinNoteWarning(draft.note);
  const remaining = CHECKIN_NOTE_MAX - (draft.note || '').length;

  // The draft carries the goal so Monday's pick and Monday's answers commit
  // together; on other days it mirrors whatever is already set for the week.
  const goal = (draft.goalFactorTag || draft.goalCustom)
    ? { factorTag: draft.goalCustom ? CHECKIN_CUSTOM_TAG : draft.goalFactorTag, customText: draft.goalCustom || '' }
    : getWeekGoal(state, wkKey);
  const needsGoal = q.stage === 'goal' || !goal;

  // Where you are in the arc. Shown so the week reads as one conversation
  // rather than five unrelated questions.
  const rail = GROW_STAGES.map(s => `
    <span class="grow-pip${s.id === q.stage ? ' active' : ''}${GROW_STAGES.findIndex(x => x.id === s.id) < GROW_STAGES.findIndex(x => x.id === q.stage) ? ' done' : ''}">${s.label}</span>`).join('');

  const tag = goalRatingTag(goal);
  const ratingBlock = (goal && tag && q.stage !== 'goal') ? `
    <div class="checkin-factor">
      <div class="checkin-factor-ask">${goalAsk(goal)}</div>
      <div class="checkin-scale" role="group" aria-label="${goalAsk(goal)}">
        ${CHECKIN_RATINGS.map(r => `
          <button class="checkin-opt${draft.ratings[tag] === r.value ? ' selected ' + r.value : ''}"
            data-checkin-factor="${tag}" data-checkin-rating="${r.value}"
            aria-pressed="${draft.ratings[tag] === r.value}">${r.label}</button>`).join('')}
      </div>
    </div>` : '';

  return `
    <div class="grow-rail">${rail}</div>
    <p class="checkin-intro">${stage.blurb}. Only you can see this — skip anything you don't fancy answering.</p>
    ${goal && q.stage !== 'goal' ? `<div class="goal-banner">
      <span class="goal-banner-label">THIS WEEK</span>
      <span class="goal-banner-text">${goalText(goal)}</span>
    </div>` : ''}
    ${needsGoal ? buildGoalPicker(draft) : ''}
    ${q.stage === 'reality' ? buildRealityPanel(dk) : ''}
    ${ratingBlock}
    <div class="checkin-factor">
      <div class="checkin-factor-ask">${q.text}</div>
      <textarea id="checkin-note" class="checkin-note" rows="3"
        maxlength="${CHECKIN_NOTE_MAX}"
        placeholder="${CHECKIN_NOTE_PLACEHOLDER}">${(draft.note || '').replace(/</g, '&lt;')}</textarea>
      <div class="checkin-note-foot">
        ${warning ? `<span class="checkin-note-warn">${warning}</span>` : '<span></span>'}
        <span class="checkin-note-count${remaining < 30 ? ' low' : ''}">${remaining}</span>
      </div>
    </div>
    <button class="checkin-save" id="checkin-save">Save check-in</button>
  `;
}

function buildCheckinSheet() {
  return `
    <div class="forecast-sheet checkin-sheet${checkinSheetOpen ? '' : ' hidden'}" id="checkin-sheet">
      <div class="forecast-backdrop" id="checkin-backdrop"></div>
      <div class="forecast-panel">
        <div class="forecast-handle"></div>
        <div class="forecast-header">
          <span class="forecast-title">Check-in</span>
          <button class="forecast-close" id="checkin-close">✕</button>
        </div>
        <div class="forecast-body">${buildCheckinBody()}</div>
      </div>
    </div>`;
}

// Swap only the body, so the panel doesn't re-animate and the keyboard stays
// put while the engineer is part-way through the note.
function refreshCheckinSheet() {
  const body = document.querySelector('#checkin-sheet .forecast-body');
  if (!body) { render(); return; }
  body.innerHTML = buildCheckinBody();
  attachCheckinSheetListeners();
}

function openCheckinSheet() {
  checkinDayKey = getTodayKey();
  const existing = getCheckin(state, checkinDayKey);
  const goal = getWeekGoal(state, getWeekKey(new Date()));
  checkinDraft = {
    ratings: Object.assign({}, (existing && existing.ratings) || {}),
    note: (existing && existing.note) || '',
    goalFactorTag: goal ? goal.factorTag : null,
    goalCustom: goal ? (goal.customText || '') : ''
  };
  checkinSheetOpen = true;
  const sheet = document.getElementById('checkin-sheet');
  if (sheet) sheet.classList.remove('hidden');
  refreshCheckinSheet();
}

function closeCheckinSheet() {
  checkinSheetOpen = false;
  checkinDraft = null;
  const sheet = document.getElementById('checkin-sheet');
  if (sheet) sheet.classList.add('hidden');
  render();
}

// Everything is optional, so this writes whatever is there — including an entry
// that is entirely blank, which is a legitimate "opened it, nothing to say".
function commitCheckin() {
  const dk = checkinDayKey || getTodayKey();
  const wkKey = getWeekKey(new Date(dk + 'T00:00:00'));
  const draft = checkinDraft || { ratings: {}, note: '' };

  // The goal commits with the day it was set on, so Monday is one save.
  if (draft.goalFactorTag || draft.goalCustom) {
    setWeekGoal(state, wkKey, { factorTag: draft.goalFactorTag, customText: draft.goalCustom });
    if (window.__ctapSyncGoal) window.__ctapSyncGoal(wkKey);
  }

  const entry = getOrCreateCheckin(state, dk);
  entry.ratings = Object.assign({}, draft.ratings);
  entry.note = (draft.note || '').slice(0, CHECKIN_NOTE_MAX);
  entry.promptId = growQuestionForDay(dk).id;
  saveState(state);
  if (window.__ctapSyncCheckin) window.__ctapSyncCheckin(dk);
  showToast('Check-in saved');
  closeCheckinSheet();
}

function attachCheckinSheetListeners() {
  // Goal picker — tap to choose, tap again to unset. Choosing from the menu
  // clears any typed goal and vice versa; there is one goal, not two.
  document.querySelectorAll('[data-goal-factor]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!checkinDraft) return;
      const tag = btn.dataset.goalFactor;
      const already = checkinDraft.goalFactorTag === tag && !checkinDraft.goalCustom;
      checkinDraft.goalFactorTag = already ? null : tag;
      checkinDraft.goalCustom = '';
      refreshCheckinSheet();
    });
  });

  const goalCustom = document.getElementById('goal-custom');
  if (goalCustom) {
    goalCustom.addEventListener('input', () => {
      if (!checkinDraft) return;
      checkinDraft.goalCustom = goalCustom.value;
      // Deselect the menu without a re-render — retyping would lose the caret.
      if (goalCustom.value.trim()) {
        document.querySelectorAll('.goal-opt.selected')
          .forEach(el => el.classList.remove('selected'));
      }
    });
  }

  document.querySelectorAll('[data-checkin-rating]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!checkinDraft) return;
      const tag = btn.dataset.checkinFactor;
      const val = btn.dataset.checkinRating;
      // Tapping the selected answer again clears it — skipping stays available
      // after you've answered, so a mis-tap isn't a permanent wrong answer.
      if (checkinDraft.ratings[tag] === val) delete checkinDraft.ratings[tag];
      else checkinDraft.ratings[tag] = val;
      refreshCheckinSheet();
    });
  });

  const note = document.getElementById('checkin-note');
  if (note) {
    note.addEventListener('input', () => {
      if (!checkinDraft) return;
      const hadWarning = !!checkinNoteWarning(checkinDraft.note);
      checkinDraft.note = note.value;
      const hasWarning = !!checkinNoteWarning(checkinDraft.note);
      // Only re-render when the warning appears or clears — a full body swap on
      // every keystroke would fight the caret.
      if (hadWarning !== hasWarning) {
        const caret = note.selectionStart;
        refreshCheckinSheet();
        const fresh = document.getElementById('checkin-note');
        if (fresh) { fresh.focus(); fresh.setSelectionRange(caret, caret); }
      } else {
        const counter = document.querySelector('#checkin-sheet .checkin-note-count');
        if (counter) {
          const left = CHECKIN_NOTE_MAX - note.value.length;
          counter.textContent = left;
          counter.classList.toggle('low', left < 30);
        }
      }
    });
  }

  const save = document.getElementById('checkin-save');
  if (save) save.addEventListener('click', commitCheckin);
}

// ── Week Summary Sheet ─────────────────────────────────────────────────────
function buildWeekSummarySheet() {
  const emptySheet = '<div class="week-summary-sheet hidden" id="week-summary-sheet"><div class="forecast-backdrop" id="summary-backdrop"></div><div class="forecast-panel"></div></div>';
  if (!weekSummaryKey) return emptySheet;
  const week = state.weeks[weekSummaryKey];
  if (!week) return emptySheet;

  const wk = weekSummaryKey;
  const wkDaysAll = weekDays(wk);
  const initDay = (activeDayKey && wkDaysAll.includes(activeDayKey)) ? activeDayKey : wkDaysAll[0];

  // All values + structured "standout" come from data.cjs's weekSummary().
  const summary       = weekSummary(state, wk);
  const earned        = summary.earned;
  const target        = summary.target;
  const bonus         = summary.bonus;
  const gap           = summary.gap;
  const pct           = summary.pct;
  const barColour     = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red';
  const bestDayName   = summary.bestDay ? summary.bestDay.name : '—';
  const bestDayHours  = summary.bestDay ? summary.bestDay.hours : 0;
  const coreCount     = summary.categoryCounts.core;
  const hiveCount     = summary.categoryCounts.hive;
  const salesCount    = summary.categoryCounts.sales;
  const absenceCount  = summary.categoryCounts.absence;
  const totalJobCount = summary.totalJobs;

  // CTAP impact display
  const ctapImpact = summary.ctapImpact;
  const ctapStr = ctapImpact === null
    ? 'Excluded'
    : (ctapImpact >= 0 ? '+' : '') + ctapImpact.toFixed(2) + 'h';
  const ctapColour = ctapImpact === null ? '' : ctapImpact >= 0 ? 'green' : 'red';
  const ctapStyle  = ctapImpact === null ? ' style="color:var(--muted)"' : '';

  // Streak display
  const streakCount = summary.streak.count;
  const streakText = streakCount >= 2
    ? (bonus ? `${streakCount} weeks in a row hitting target` : `Missed target ${streakCount} weeks running`)
    : (bonus ? 'Bonus hit this week' : 'Missed target this week');

  // Standout display
  let standoutText = null;
  if (summary.standout) {
    const s = summary.standout;
    if (s.kind === 'highest_job') {
      standoutText = `Highest single job: ${s.name} — ${s.hours.toFixed(2)}h`;
    } else if (s.kind === 'busiest_day') {
      standoutText = `Busiest day: ${s.dayName} with ${s.count} jobs`;
    } else if (s.kind === 'total_jobs') {
      standoutText = `${s.count} job${s.count === 1 ? '' : 's'} logged across the week`;
    }
  }

  return `
    <div class="week-summary-sheet" id="week-summary-sheet">
      <div class="forecast-backdrop" id="summary-backdrop"></div>
      <div class="forecast-panel">
        <div class="forecast-handle"></div>
        <div class="forecast-header">
          <div>
            <div class="forecast-title">Week Summary</div>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:1px">${weekLabel(wk)}</div>
          </div>
          <button class="forecast-close" id="summary-close">✕</button>
        </div>
        <div class="forecast-body">

          ${buildDayStrip(wk, week, initDay)}
          <div class="day-detail-wrap">${buildDayDetailPanel(wk, week, initDay, dayEditMode)}</div>
          <div class="ddp-divider"></div>

          <div class="wsum-status-banner ${bonus ? 'green' : 'red'}">
            <div class="wsum-status-icon">${bonus ? '✓' : '✕'}</div>
            <div>
              <div class="wsum-status-title">${bonus ? 'Bonus achieved' : 'Missed target'}</div>
              <div class="wsum-status-sub">${bonus
                ? '+' + gap.toFixed(2) + 'h above target'
                : Math.abs(gap).toFixed(2) + 'h short of target'}</div>
            </div>
          </div>

          <div class="forecast-prog-row" style="margin-top:14px">
            <span class="forecast-prog-label">Credits earned</span>
            <span class="forecast-prog-val">${earned.toFixed(2)}h <span class="forecast-prog-of">of ${target.toFixed(1)}h</span></span>
          </div>
          <div class="progress-bar" style="margin:7px 0 4px">
            <div class="progress-bar-fill ${barColour}" style="width:${pct.toFixed(1)}%"></div>
          </div>
          ${buildCtapTrend()}

          ${(week.travelHours || week.waitWorkHours) ? `
          <div style="font-size:0.57rem;font-weight:700;letter-spacing:0.1em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Retrospective</div>
          <div class="wsum-retro-rows">
            ${week.travelHours ? `<div class="wsum-retro-row"><span class="wsum-retro-lbl">Travel</span><span class="wsum-retro-val" style="color:var(--amber)">−${week.travelHours.toFixed(2)}h target</span></div>` : ''}
            ${week.waitWorkHours ? `<div class="wsum-retro-row"><span class="wsum-retro-lbl">Wait Work</span><span class="wsum-retro-val" style="color:var(--green)">+${week.waitWorkHours.toFixed(2)}h credit</span></div>` : ''}
          </div>` : ''}

          <div class="forecast-stats" style="margin-bottom:14px">
            <div class="forecast-stat">
              <div class="forecast-stat-label">Best day</div>
              <div class="forecast-stat-val" style="font-size:0.88rem;letter-spacing:-0.2px">${bestDayName}</div>
              <div style="font-size:0.67rem;color:var(--muted);margin-top:2px">${bestDayHours > 0 ? bestDayHours.toFixed(2) + 'h' : '—'}</div>
            </div>
            <div class="forecast-stat">
              <div class="forecast-stat-label">CTAP impact</div>
              <div class="forecast-stat-val ${ctapColour}"${ctapStyle}>${ctapStr}</div>
            </div>
            <div class="forecast-stat">
              <div class="forecast-stat-label">Total jobs</div>
              <div class="forecast-stat-val">${totalJobCount}</div>
            </div>
          </div>

          <div style="font-size:0.57rem;font-weight:700;letter-spacing:0.1em;color:var(--muted);text-transform:uppercase;margin-bottom:8px">Jobs by Category</div>
          <div class="wsum-cats">
            <div class="wsum-cat">
              <div class="wsum-cat-count">${coreCount}</div>
              <div class="wsum-cat-label">Core</div>
            </div>
            <div class="wsum-cat">
              <div class="wsum-cat-count${hiveCount > 0 ? ' accent' : ''}">${hiveCount}</div>
              <div class="wsum-cat-label">Hive</div>
            </div>
            <div class="wsum-cat">
              <div class="wsum-cat-count${salesCount > 0 ? ' accent' : ''}">${salesCount}</div>
              <div class="wsum-cat-label">Sales</div>
            </div>
            <div class="wsum-cat">
              <div class="wsum-cat-count">${absenceCount}</div>
              <div class="wsum-cat-label">Absence</div>
            </div>
          </div>

          <div class="wsum-streak-box">
            <span class="tip-dot ${bonus ? 'green' : 'red'}" style="flex-shrink:0;margin-top:0"></span>
            <span class="wsum-streak-text">${streakText}</span>
          </div>

          ${standoutText ? `
          <div class="wsum-standout-box">
            <div class="wsum-standout-label">Standout</div>
            <div class="wsum-standout-text">${standoutText}</div>
          </div>` : ''}

        </div>
      </div>
    </div>
  `;
}

function closeWeekSummary() {
  weekSummaryKey = null;
  dayEditMode = false;
  const el = document.getElementById('week-summary-sheet');
  if (el) el.classList.add('hidden');
  render();
}

// ── Listeners ──────────────────────────────────────────────────────────────
function attachListeners() {
  // Greeting typewriter + trailing dots (plays on open/refresh and when greeting changes)
  const greetEl = document.getElementById('greeting-text');
  const isNewGreeting = !!greetEl && greetEl.dataset.greeting !== lastGreeting;
  if (window.__pixelEngineer) {
    window.__pixelEngineer.stop();   // one render rebuilt every lane
    window.__pixelEngineer.mount(document.getElementById('pixel-lane'), { intro: isNewGreeting });
    window.__pixelEngineer.mount(document.getElementById('coach-eng'), { pose: 'talk' });
  }
  const greetLive = document.getElementById('greeting-live');
  if (greetEl && greetLive) {
    const text = greetEl.dataset.greeting;
    if (isNewGreeting) {
      lastGreeting = text;
      greetLive.textContent = '';
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          greetLive.textContent += text[i++];
        } else {
          clearInterval(timer);
          // Dots roll: . .. ... . .. ... . .. ...  then settle clean
          let d = 1;
          const dotTimer = setInterval(() => {
            greetLive.textContent = text + '.'.repeat(d);
            d++;
            if (d > 3) clearInterval(dotTimer);
          }, 380);
        }
      }, 52);
    }
  }

  // First-run setup card
  const setupDismiss = document.getElementById('setup-dismiss');
  if (setupDismiss) setupDismiss.addEventListener('click', () => {
    localStorage.setItem(SETUP_DISMISSED_KEY, 'true');
    render();
  });
  document.querySelectorAll('[data-setup-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.dataset.setupStep;
      if (step === 'balance') {
        activeTab = 'settings';
        startBalSignNeg = null;
      } else if (step === 'shifts') {
        activeTab = 'schedule';
      } else if (step === 'howto') {
        // Opened and marked read in one tap, so the step completes on the
        // action the engineer actually took rather than on a second one.
        activeTab = 'settings';
        howToExpanded = true;
        localStorage.setItem(HOWTO_SEEN_KEY, 'true');
      }
      render();
    });
  });

  // Bottom nav
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      weekSummaryKey = null;
      activeTab = tab;
      if (activeTab === 'dashboard') { currentWeekKey = getWeekKey(new Date()); ctapProjectedMode = true; }
      if (activeTab === 'log') { setLogDay(getTodayKey()); logCategory = null; jobSearch = ''; logSearchOpen = false; }
      if (activeTab === 'settings') startBalSignNeg = null;   // re-derive from the stored value
      render();
    });
  });

  // Dashboard week navigation
  const prevBtn = document.getElementById('prev-week');
  const nextBtn = document.getElementById('next-week');
  if (prevBtn) prevBtn.addEventListener('click', () => {
    weekSummaryKey = null;
    const d = new Date(currentWeekKey + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    currentWeekKey = getWeekKey(d);
    render();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    weekSummaryKey = null;
    const d = new Date(currentWeekKey + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    const newKey = getWeekKey(d);
    if (newKey <= getWeekKey(new Date())) { currentWeekKey = newKey; render(); }
  });

  // Schedule day-note toggle
  document.querySelectorAll('[data-action="toggle-note"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const dk = btn.dataset.day;
      scheduleNoteOpenDay = scheduleNoteOpenDay === dk ? null : dk;
      render();
      if (scheduleNoteOpenDay === dk) {
        const inp = document.querySelector(`.sched-note-input[data-day="${dk}"]`);
        if (inp) inp.focus();
      }
    });
  });
  // Schedule day-note auto-save
  document.querySelectorAll('.sched-note-input').forEach(input => {
    input.addEventListener('blur', () => {
      const dk = input.dataset.day;
      const wk = getOrCreateWeek(state, currentWeekKey);
      if (!wk.shifts) wk.shifts = {};
      if (!wk.shifts[dk]) wk.shifts[dk] = {};
      const val = input.value.trim();
      if (val) wk.shifts[dk].note = val; else delete wk.shifts[dk].note;
      saveState(state);
      if (window.__ctapSyncWeek) window.__ctapSyncWeek(currentWeekKey);
    });
  });

  // Schedule inline week navigation
  const schedPrev = document.getElementById('sched-prev-week');
  const schedNext = document.getElementById('sched-next-week');
  if (schedPrev) schedPrev.addEventListener('click', () => {
    const d = new Date(currentWeekKey + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    currentWeekKey = getWeekKey(d);
    weekendExpanded = false;
    scheduleNoteOpenDay = null;
    render();
  });
  if (schedNext) schedNext.addEventListener('click', () => {
    const d = new Date(currentWeekKey + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    const newKey = getWeekKey(d);
    const maxFuture = new Date(); maxFuture.setDate(maxFuture.getDate() + 56);
    if (newKey <= getWeekKey(maxFuture)) { currentWeekKey = newKey; weekendExpanded = false; scheduleNoteOpenDay = null; render(); }
  });

  // Log Job day picker — tap any day on the strip to log into it.
  document.querySelectorAll('[data-log-day-pick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.logDayPick;
      if (key > getTodayKey()) return;   // no logging into the future
      setLogDay(key);
      render();
    });
  });

  // Log Job week navigation — stepping back reaches a finished week's days,
  // which the old rolling strip only covered by accident.
  document.querySelectorAll('[data-log-week]').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.dataset.logWeek, 10);
      const todayWeek = getWeekKey(new Date());
      if (delta === 0) { setLogDay(getTodayKey()); render(); return; }
      const d = new Date(logWeekKey + 'T00:00:00');
      d.setDate(d.getDate() + delta * 7);
      const newKey = getWeekKey(d);
      if (newKey > todayWeek) return;         // nothing has happened there yet
      logWeekKey = newKey;
      // Land on a day that exists on the new strip: today if it's in there,
      // otherwise the last day of it that has actually happened.
      const todayKey = getTodayKey();
      const days = weekDays(newKey).filter(k => k <= todayKey);
      activeLogDay = newKey === todayWeek ? todayKey : days[days.length - 1];
      render();
    });
  });

  // Category tiles — open one full screen, and come back out of it.
  document.querySelectorAll('[data-log-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      logCategory = btn.dataset.logCat;
      render();
      const main = document.querySelector('.main');
      if (main) main.scrollTop = 0;
    });
  });
  const catBack = document.getElementById('log-cat-back');
  if (catBack) catBack.addEventListener('click', () => { logCategory = null; render(); });
  const catDay = document.getElementById('log-cat-day');
  if (catDay) catDay.addEventListener('click', () => {
    logCategory = null; logSearchOpen = false; jobSearch = ''; render();
  });

  // Remove an entry from the day panel. It cannot reuse .del-btn: that one
  // writes into currentWeekKey, the Dashboard's week, which is the wrong week
  // as soon as you step the Log Job strip back.
  document.querySelectorAll('.lj-log-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      const dayKey = btn.dataset.ljDelDay;
      const weekKey = getWeekKey(new Date(dayKey + 'T00:00:00'));
      const week = getOrCreateWeek(state, weekKey);
      if (btn.dataset.ljDelDed !== undefined) {
        (week.deductionLog || []).splice(parseInt(btn.dataset.ljDelDed, 10), 1);
      } else {
        const idx = parseInt(btn.dataset.ljDelIdx, 10);
        if (!week.days || !week.days[dayKey]) return;
        week.days[dayKey].splice(idx, 1);
        if (week.days[dayKey].length === 0) delete week.days[dayKey];
      }
      saveState(state);
      if (window.__ctapSyncWeek) window.__ctapSyncWeek(weekKey);
      render();
    });
  });

  // Job search
  const searchInput = document.getElementById('job-search');
  const searchClear = document.getElementById('search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      jobSearch = searchInput.value;
      render();
      const fresh = document.getElementById('job-search');
      if (fresh) { fresh.focus(); fresh.setSelectionRange(fresh.value.length, fresh.value.length); }
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      jobSearch = '';
      render();
      const fresh = document.getElementById('job-search');
      if (fresh) fresh.focus();
    });
  }
  const searchOpen = document.getElementById('log-search-open');
  if (searchOpen) searchOpen.addEventListener('click', () => {
    logSearchOpen = true;
    render();
    const fresh = document.getElementById('job-search');
    if (fresh) fresh.focus();
  });
  const searchClose = document.getElementById('search-close');
  if (searchClose) searchClose.addEventListener('click', () => {
    logSearchOpen = false;
    jobSearch = '';
    render();
  });

  // Job buttons
  document.querySelectorAll('[data-job-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.jobId;
      const job = findJob(id);
      if (!job) return;
      if (job.variable) {
        openModal(job);
      } else {
        logJob(job, null);
      }
    });
  });

  // Collapsible day sections
  document.querySelectorAll('.day-header').forEach(header => {
    header.addEventListener('click', () => {
      header.closest('.day-section').classList.toggle('open');
    });
  });

  // Delete job entry
  document.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (btn.classList.contains('del-ded-btn') || btn.classList.contains('del-mentor-btn')) return;
      const dayKey = btn.dataset.day;
      const idx = parseInt(btn.dataset.idx, 10);
      const week = getOrCreateWeek(state, currentWeekKey);
      week.days[dayKey].splice(idx, 1);
      if (week.days[dayKey].length === 0) delete week.days[dayKey];
      saveState(state);
      if (window.__ctapSyncWeek) window.__ctapSyncWeek(currentWeekKey);
      render();
    });
  });

  // Delete mentor day flag
  document.querySelectorAll('.del-mentor-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const dayKey = btn.dataset.day;
      const weekKey = getWeekKey(new Date(dayKey + 'T00:00:00'));
      const week = state.weeks[weekKey];
      if (week && week.mentorDays) {
        delete week.mentorDays[dayKey];
        saveState(state);
        if (window.__ctapSyncWeek) window.__ctapSyncWeek(weekKey);
        render();
      }
    });
  });

  // Delete deduction log entry
  document.querySelectorAll('.del-ded-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.dedIdx, 10);
      const week = getOrCreateWeek(state, currentWeekKey);
      if (!week.deductionLog) return;
      week.deductionLog.splice(idx, 1);
      week.deductionMins = week.deductionLog.reduce((s, d) => s + d.mins, 0);
      saveState(state);
      if (window.__ctapSyncWeek) window.__ctapSyncWeek(currentWeekKey);
      render();
    });
  });

  // Save deductions
  const dedInput = document.getElementById('ded-hrs');
  if (dedInput) {
    dedInput.addEventListener('focus', () => {
      dedInput.placeholder = '';
      dedInput.select();
    });
    dedInput.addEventListener('blur', () => {
      if (!dedInput.value) dedInput.placeholder = '0.00';
    });
  }
  const saveDed = document.getElementById('save-ded');
  if (saveDed) saveDed.addEventListener('click', () => {
    const hrs = parseFloat(document.getElementById('ded-hrs').value) || 0;
    if (hrs <= 0) { showToast('Enter hours first'); return; }
    const nameVal = (document.getElementById('ded-name').value || '').trim() || 'Non-productive time';
    const week = getOrCreateWeek(state, currentWeekKey);
    if (!week.deductionLog) week.deductionLog = [];
    week.deductionLog.push({ name: nameVal, mins: hrs * 60, date: getTodayKey() });
    week.deductionMins = week.deductionLog.reduce((s, d) => s + d.mins, 0);
    saveState(state);
    render();
    showToast(nameVal + ' added');
  });

  // Toggle annual leave for a day
  document.querySelectorAll('[data-action="toggle-leave"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const dk = btn.dataset.day;
      const week = getOrCreateWeek(state, currentWeekKey);
      if (!week.shifts) week.shifts = {};
      if (!week.shifts[dk]) week.shifts[dk] = {};
      const s = week.shifts[dk];
      if (s.leave) {
        delete s.leave;
      } else {
        s.leave = true;
        delete s.start;
        delete s.end;
        delete s.lunch;
      }
      saveState(state);
      render();
    });
  });

  // Apply standard week (Mon–Fri 08:00–16:30, 30m lunch)
  const applyDefault = document.getElementById('apply-default');
  if (applyDefault) applyDefault.addEventListener('click', () => {
    const week = getOrCreateWeek(state, currentWeekKey);
    if (!week.shifts) week.shifts = {};
    const days = weekDays(currentWeekKey);
    days.forEach((dk, i) => {
      if (i < 5) {
        week.shifts[dk] = { start: '08:00', end: '16:30', lunch: String(state.defaultLunch !== undefined ? state.defaultLunch : 30) };
      }
    });
    saveState(state);
    render();
    showToast('Standard week applied');
  });

  // Auto-save shift inputs on change
  function flashAutosave() {
    const el = document.getElementById('autosave-check');
    if (el) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1200); }
  }
  // Shift times are set in the shift sheet, not in native time inputs: saving and
  // redrawing on each input change closed the iPhone's wheel after the first scroll.
  document.querySelectorAll('[data-action="edit-shift"]').forEach(btn => {
    btn.addEventListener('click', () => openShiftSheet(btn.dataset.day));
  });
  const shiftSheetEl = document.getElementById('shift-sheet');
  if (shiftSheetEl) {
    const closeWithoutSaving = () => { shiftSheet = null; render(); };
    document.getElementById('shift-close').addEventListener('click', closeWithoutSaving);
    document.getElementById('shift-backdrop').addEventListener('click', closeWithoutSaving);

    // A finger scroll picks whatever value comes to rest in the band. Patched in
    // place rather than redrawn, which would snap the wheel back mid-scroll.
    shiftSheetEl.querySelectorAll('.shift-wheel').forEach(w => {
      let settle = null;
      w.addEventListener('scroll', () => {
        clearTimeout(settle);
        settle = setTimeout(() => {
          const v = shiftWheelValueAtCentre(w);
          if (!v || !shiftSheet) return;
          setShiftSheetValue(w.dataset.wheel, v);
          refreshShiftSheet();
        }, 120);
      }, { passive: true });
    });

    shiftSheetEl.addEventListener('click', e => {
      const opt = e.target.closest('[data-wheel] [data-value]');
      if (opt) {
        setShiftSheetValue(opt.closest('[data-wheel]').dataset.wheel, opt.dataset.value);
        refreshShiftSheet();
        centreShiftWheels(true);
        return;
      }
      const chip = e.target.closest('[data-apply-day]');
      if (chip) {
        const d = chip.dataset.applyDay;
        const chosen = new Set(shiftSheet.applyTo);
        if (chosen.has(d)) chosen.delete(d); else chosen.add(d);
        shiftSheet.applyTo = weekDays(currentWeekKey).filter(x => chosen.has(x));
        refreshShiftSheet();
        return;
      }
      if (e.target.closest('#apply-rest-week')) { shiftSheet.applyTo = shiftSheetDaysFor('rest'); refreshShiftSheet(); return; }
      if (e.target.closest('#apply-whole-week')) { shiftSheet.applyTo = shiftSheetDaysFor('whole'); refreshShiftSheet(); return; }
      if (e.target.closest('#shift-confirm')) { confirmShiftSheet(); return; }
      if (e.target.closest('#shift-clear')) { clearShiftSheetDay(); }
    });
  }


  // Default lunch chip — cycle through options
  const defaultLunchChip = document.getElementById('default-lunch-chip');
  if (defaultLunchChip) defaultLunchChip.addEventListener('click', () => {
    const opts = [0, 15, 30, 45, 60];
    const cur = state.defaultLunch !== undefined ? state.defaultLunch : 30;
    const idx = opts.indexOf(Number(cur));
    state.defaultLunch = opts[(idx + 1) % opts.length];
    saveState(state);
    flashAutosave();
    render();
  });


  // Coach mode toggle
  const coachToggle = document.getElementById('coach-mode-toggle');
  if (coachToggle) coachToggle.addEventListener('change', () => {
    const on = coachToggle.checked;
    localStorage.setItem('jcpd_coach_mode', on ? 'true' : 'false');
    if (window.__ctapSyncProfile) window.__ctapSyncProfile({ coach_mode: on });
    render();
  });

  // Daily check-in toggle
  const checkinToggle = document.getElementById('checkin-toggle');
  if (checkinToggle) checkinToggle.addEventListener('change', () => {
    const on = checkinToggle.checked;
    localStorage.setItem('jcpd_checkin_on', on ? 'true' : 'false');
    if (window.__ctapSyncProfile) window.__ctapSyncProfile({ checkin_enabled: on });
    render();
  });

  // Your name — saved as you type, no re-render (that would steal focus).
  const nameInput = document.getElementById('display-name-input');
  if (nameInput) nameInput.addEventListener('input', () => {
    try { localStorage.setItem('jcpd_name', nameInput.value.trim()); } catch {}
  });

  // Erase all data — two-step confirm. There is no cloud copy, so this is the
  // whole of it: clear the state key and every jcpd_* preference, then reload
  // onto a fresh default state.
  const eraseBtn = document.getElementById('erase-data-btn');
  if (eraseBtn) eraseBtn.addEventListener('click', () => {
    eraseDataStep = 'confirm';
    render();
    const inp = document.getElementById('delete-confirm-input');
    if (inp) inp.focus();
  });
  const deleteCancelBtn = document.getElementById('delete-cancel-btn');
  if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', () => {
    eraseDataStep = 'idle';
    render();
  });
  const deleteInput = document.getElementById('delete-confirm-input');
  const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
  if (deleteInput && deleteConfirmBtn) {
    deleteInput.addEventListener('input', () => {
      deleteConfirmBtn.disabled = deleteInput.value.trim().toUpperCase() !== 'ERASE';
    });
  }
  if (deleteConfirmBtn) deleteConfirmBtn.addEventListener('click', () => {
    if (deleteInput && deleteInput.value.trim().toUpperCase() !== 'ERASE') return;
    deleteConfirmBtn.textContent = 'Erasing…';
    deleteConfirmBtn.disabled = true;
    try {
      localStorage.removeItem('jct_state');
      Object.keys(localStorage)
        .filter(k => k.startsWith('jcpd_'))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
    location.reload();
  });

  const addJobBtn = document.getElementById('go-log-tab-empty');
  if (addJobBtn) addJobBtn.addEventListener('click', () => { activeTab = 'log'; render(); });

  // CTAP projected toggle
  const ctapProjToggle = document.getElementById('ctap-proj-toggle');
  if (ctapProjToggle) ctapProjToggle.addEventListener('click', () => {
    ctapProjectedMode = !ctapProjectedMode;
    render();
  });

  // iOS sticky-header workaround: when a <details> on the dashboard
  // collapses, the page shrinks under a scrolled viewport and the sticky
  // .top-bar can detach until the next scroll. Nudging scroll by 0 forces
  // iOS to re-anchor it.
  document.querySelectorAll('details.insights-details').forEach(d => {
    d.addEventListener('toggle', () => {
      requestAnimationFrame(() => {
        window.scrollTo(window.scrollX, window.scrollY);
      });
    });
  });

  // Credit graph dot tap — floating tooltip above dot, highlight selected
  const graphCard = document.querySelector('.credit-graph-card');
  if (graphCard) {
    graphCard.addEventListener('click', e => {
      const hit = e.target.closest('.graph-dot-hit');
      if (!hit) return;
      const dk      = hit.dataset.day;
      const count   = parseInt(hit.dataset.jobs, 10);
      const credits = parseFloat(hit.dataset.credits || '0');
      const tooltip = document.getElementById('graph-tooltip');
      if (!tooltip) return;

      if (graphSelectedDay === dk) {
        // tap same dot → dismiss
        graphSelectedDay = null;
        tooltip.style.display = 'none';
        document.querySelectorAll('.graph-dot-selected').forEach(d => d.classList.remove('graph-dot-selected'));
        return;
      }

      graphSelectedDay = dk;

      // Highlight dot
      document.querySelectorAll('.graph-dot-selected').forEach(d => d.classList.remove('graph-dot-selected'));
      const dot = hit.previousElementSibling;
      if (dot) dot.classList.add('graph-dot-selected');

      // Position tooltip above hit area, relative to card
      const cardRect = graphCard.getBoundingClientRect();
      const hitRect  = hit.getBoundingClientRect();
      const cx = hitRect.left + hitRect.width / 2 - cardRect.left;
      const cy = hitRect.top - cardRect.top;
      const tipW = 110;
      const left = Math.max(4, Math.min(cx - tipW / 2, cardRect.width - tipW - 4));
      const top  = Math.max(4, cy - 44);

      const dayName = new Date(dk + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const body    = credits > 0 ? `${credits.toFixed(2)}h · ${count} job${count !== 1 ? 's' : ''}` : 'No jobs logged';

      tooltip.innerHTML = `<strong>${dayName}</strong><br>${body}`;
      tooltip.style.left    = `${left}px`;
      tooltip.style.top     = `${top}px`;
      tooltip.style.display = 'block';
      tooltip.dataset.activeDay = dk;
    });
  }

  // Credit graph week navigation
  const graphPrev = document.getElementById('graph-prev-week');
  const graphNext = document.getElementById('graph-next-week');
  if (graphPrev) graphPrev.addEventListener('click', () => {
    const d = new Date(graphWeekKey + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    graphWeekKey = getWeekKey(d);
    graphSelectedDay = null;
    render();
  });
  if (graphNext) graphNext.addEventListener('click', () => {
    const d = new Date(graphWeekKey + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    const nk = getWeekKey(d);
    if (nk <= getWeekKey(new Date())) { graphWeekKey = nk; graphSelectedDay = null; render(); }
  });

  // Dismiss deficit-cleared celebration card
  const dismissDeficit = document.getElementById('dismiss-deficit-cleared');
  if (dismissDeficit) dismissDeficit.addEventListener('click', () => {
    localStorage.setItem('jcpd_deficit_cleared_seen', 'true');
    const card = document.getElementById('deficit-cleared-card');
    if (card) card.remove();
  });

  // Theme toggle (segmented control)
  function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('jcpd_theme', theme);
    if (window.__ctapSyncProfile) window.__ctapSyncProfile({ theme });
    showToast('✓ Saved');
    render();
  }
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
  // Swipe on the segmented control: right → light, left → dark
  const themeSeg = document.querySelector('.st-seg');
  if (themeSeg) {
    let _swipeX = 0;
    themeSeg.addEventListener('touchstart', e => { _swipeX = e.touches[0].clientX; }, { passive: true });
    themeSeg.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - _swipeX;
      if (Math.abs(dx) < 24) return;
      applyTheme(dx > 0 ? 'light' : 'dark');
    }, { passive: true });
  }

  // Settings target inputs — clear on focus, save on blur/change
  function bindNumInput(id, setFn, parseFn, restoreFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('focus', () => { el.value = ''; });
    el.addEventListener('blur', () => {
      const v = parseFn(el.value);
      if (el.value === '' || isNaN(v)) { el.value = restoreFn(); return; }
      setFn(v); el.value = restoreFn();
      saveState(state); showToast('✓ Saved');
    });
  }
  bindNumInput('base-hours-input',
    v => { state.baseHours = v; },
    v => Math.max(1, Math.min(80, parseInt(v) || 40)),
    () => state.baseHours || 40);
  bindNumInput('wk-pct-input',
    v => { state.weeklyTargetPct = v / 100; },
    v => Math.max(50, Math.min(100, parseInt(v) || 80)),
    () => Math.round((state.weeklyTargetPct || 0.8) * 100));
  // The field holds the magnitude; the +/− button holds the sign.
  bindNumInput('start-bal-input',
    v => { state.startingBalance = parseFloat(((startBalNegative() ? -1 : 1) * v).toFixed(1)); },
    v => Math.max(0, Math.min(999, Math.abs(parseFloat(v) || 0))),
    () => Math.abs(state.startingBalance || 0).toFixed(1));

  // In credit / in deficit. Applied to the stored value straight away so the
  // dashboard doesn't sit on the wrong side of zero until the field is touched.
  const startBalSign = document.getElementById('start-bal-sign');
  if (startBalSign) startBalSign.addEventListener('click', () => {
    startBalSignNeg = !startBalNegative();
    const mag = Math.abs(state.startingBalance || 0);
    state.startingBalance = parseFloat(((startBalSignNeg ? -1 : 1) * mag).toFixed(1));
    saveState(state);
    showToast(startBalSignNeg ? 'In deficit' : 'In credit');
    render();
  });

  // Best advice strip — dismiss one opportunity for the day, keep the rest
  document.querySelectorAll('[data-dismiss-opp]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      localStorage.setItem(`jcpd_coach_opp_${btn.dataset.dismissDay}_${btn.dataset.dismissOpp}`, 'true');
      const row = btn.closest('[data-opp-row]');
      if (row) row.remove();
      const strip = document.getElementById('coach-opp-strip');
      if (strip && !strip.querySelector('[data-opp-row]')) strip.remove();
    });
  });

  // Settings info popovers
  document.querySelectorAll('.st-info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key = btn.dataset.info;
      openSettingsInfo = openSettingsInfo === key ? null : key;
      render();
    });
  });
  // Dismiss info popover on outside tap
  document.addEventListener('click', () => {
    if (openSettingsInfo) { openSettingsInfo = null; render(); }
  }, { once: true });

  // How to use — expand/collapse
  const howToBtn = document.getElementById('toggle-how-to');
  if (howToBtn) howToBtn.addEventListener('click', () => {
    howToExpanded = !howToExpanded;
    if (howToExpanded) localStorage.setItem(HOWTO_SEEN_KEY, 'true');
    render();
  });

  // How credits work — expand/collapse
  const legalBtn = document.getElementById('toggle-legal-info');
  if (legalBtn) legalBtn.addEventListener('click', () => { legalInfoExpanded = !legalInfoExpanded; render(); });

  // History item click → navigate to that week; show summary for past weeks
  document.querySelectorAll('[data-goto-week]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.hi-retro')) return;
      const wk = el.dataset.gotoWeek;
      // Zero-hour past history items expand/collapse instead of navigating
      if (el.classList.contains('history-item')) {
        const week = state.weeks[wk];
        const earned = week ? weekCreditHours(week) : 0;
        if (earned === 0 && wk < getWeekKey(new Date())) {
          expandedZeroWeek = expandedZeroWeek === wk ? null : wk;
          render();
          return;
        }
      }
      currentWeekKey = wk;
      weekSummaryKey = wk < getWeekKey(new Date()) ? wk : null;
      if (weekSummaryKey) activeDayKey = weekDays(wk)[0];
      render();
    });
  });

  // Day strip + day detail panel — event delegation on both sheets
  ['forecast-sheet', 'week-summary-sheet'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handleSheetInteraction);
  });

  // Retro fields (Travel / Wait Work) — save on blur
  document.querySelectorAll('.retro-input').forEach(input => {
    input.addEventListener('blur', () => {
      const field = input.dataset.retroField;
      const wk = input.dataset.weekKey;
      if (!state.weeks[wk]) return;
      const raw = input.value.trim();
      if (raw === '') {
        delete state.weeks[wk][field];
      } else {
        const val = parseFloat(raw);
        if (!isNaN(val) && val >= 0) state.weeks[wk][field] = val;
      }
      saveState(state);
      render();
    });
  });

  // CTAP exclude toggle per past week
  document.querySelectorAll('.ctap-toggle-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const wk = btn.dataset.weekKey;
      if (state.weeks[wk]) {
        state.weeks[wk].excludeFromCtap = !state.weeks[wk].excludeFromCtap;
        saveState(state);
        const ctapMsg = state.weeks[wk].excludeFromCtap ? 'Week excluded from CTAP' : 'Week included in CTAP';
        render();
        showToast(ctapMsg);
      }
    });
  });

  // Week tile → forecast sheet
  const weekTile = document.getElementById('week-tile');
  if (weekTile) weekTile.addEventListener('click', openForecastSheet);
  const forecastClose = document.getElementById('forecast-close');
  if (forecastClose) forecastClose.addEventListener('click', closeForecastSheet);
  const forecastBackdrop = document.getElementById('forecast-backdrop');
  if (forecastBackdrop) forecastBackdrop.addEventListener('click', closeForecastSheet);

  // Week summary sheet
  const summaryClose = document.getElementById('summary-close');
  if (summaryClose) summaryClose.addEventListener('click', closeWeekSummary);
  const summaryBackdrop = document.getElementById('summary-backdrop');
  if (summaryBackdrop) summaryBackdrop.addEventListener('click', closeWeekSummary);

  // Swipe-down-to-close for both sheets
  function addSheetSwipe(panel, closeFn) {
    if (!panel) return;
    let startY = 0, startScrollTop = 0, active = false;
    panel.addEventListener('touchstart', e => {
      startY = e.touches[0].clientY;
      startScrollTop = panel.scrollTop;
      active = false;
    }, { passive: true });
    panel.addEventListener('touchmove', e => {
      const dy = e.touches[0].clientY - startY;
      if (!active) {
        if (dy > 6 && startScrollTop === 0) active = true;
        else return;
      }
      if (dy > 0) {
        panel.style.transition = 'none';
        panel.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: true });
    panel.addEventListener('touchend', e => {
      if (!active) return;
      const dy = e.changedTouches[0].clientY - startY;
      active = false;
      if (dy > 80) {
        panel.style.transition = 'transform 0.22s ease-out';
        panel.style.transform = `translateY(100%)`;
        setTimeout(() => { panel.style.transform = ''; panel.style.transition = ''; closeFn(); }, 220);
      } else {
        panel.style.transition = 'transform 0.25s cubic-bezier(0.32,0.72,0,1)';
        panel.style.transform = '';
        setTimeout(() => { panel.style.transition = ''; }, 260);
      }
    });
  }
  const forecastPanel = document.querySelector('#forecast-sheet .forecast-panel');
  const summaryPanel  = document.querySelector('#week-summary-sheet .forecast-panel');
  const cashoutPanel  = document.querySelector('#cashout-sheet .forecast-panel');
  const voicePanel    = document.querySelector('#voice-sheet .forecast-panel');
  const checkinPanel  = document.querySelector('#checkin-sheet .forecast-panel');
  addSheetSwipe(forecastPanel, closeForecastSheet);
  addSheetSwipe(summaryPanel,  closeWeekSummary);
  addSheetSwipe(cashoutPanel,  closeCashOutSheet);
  addSheetSwipe(voicePanel,    closeVoiceSheet);
  addSheetSwipe(checkinPanel,  closeCheckinSheet);

  // Voice logging
  const voiceBtn = document.getElementById('voice-btn');
  if (voiceBtn) voiceBtn.addEventListener('click', openVoiceSheet);
  const voiceClose = document.getElementById('voice-close');
  if (voiceClose) voiceClose.addEventListener('click', closeVoiceSheet);
  const voiceBackdrop = document.getElementById('voice-backdrop');
  if (voiceBackdrop) voiceBackdrop.addEventListener('click', closeVoiceSheet);
  attachVoiceSheetListeners();

  // Daily check-in
  const checkinOpen = document.getElementById('checkin-open');
  if (checkinOpen) checkinOpen.addEventListener('click', openCheckinSheet);
  const checkinClose = document.getElementById('checkin-close');
  if (checkinClose) checkinClose.addEventListener('click', closeCheckinSheet);
  const checkinBackdrop = document.getElementById('checkin-backdrop');
  if (checkinBackdrop) checkinBackdrop.addEventListener('click', closeCheckinSheet);
  attachCheckinSheetListeners();

  // CTAP tile → cash-out sheet
  const ctapTile = document.getElementById('ctap-tile');
  if (ctapTile) ctapTile.addEventListener('click', openCashOutSheet);
  const cashoutBackdrop = document.getElementById('cashout-backdrop');
  if (cashoutBackdrop) cashoutBackdrop.addEventListener('click', closeCashOutSheet);
  const cashoutSheet = document.getElementById('cashout-sheet');
  if (cashoutSheet) cashoutSheet.addEventListener('click', e => {
    if (e.target.closest('#cashout-close')) {
      closeCashOutSheet();
      return;
    }
    const multBtn = e.target.closest('.cashout-mult-btn');
    if (multBtn) {
      cashOutMultiplier = parseFloat(multBtn.dataset.mult);
      refreshSheetInPlace('cashout-sheet');
      return;
    }
    const taxBtn = e.target.closest('.cashout-tax-btn');
    if (taxBtn) {
      cashOutTaxRate = taxBtn.dataset.tax;
      refreshSheetInPlace('cashout-sheet');
      return;
    }
    // Steppers. A rebuild is fine here: a tap carries no caret to lose, and
    // the field has to pick up the new value.
    const step = e.target.closest('#cashout-minus') ? -1
               : e.target.closest('#cashout-plus') ? 1 : 0;
    if (step !== 0) {
      const bal = cumulativeBalance(state);
      const current = cashOutHours === null ? Math.max(0, bal) : cashOutHours;
      cashOutHours = clampCashOutHours(current + step);
      refreshSheetInPlace('cashout-sheet');
    }
  });

  // Delegated, not bound to the field itself: every multiplier tap, stepper
  // and sheet open runs refreshSheetInPlace, which replaces panel.innerHTML
  // and would throw away a listener attached to the input directly. The first
  // build of this bound the element and the modeller went dead after one tap.
  if (cashoutSheet) {
    cashoutSheet.addEventListener('input', e => {
      if (!e.target.closest('#cashout-hours-input')) return;
      // An empty field is mid-edit, not zero. Hold the last figure rather than
      // flashing £0.00 between the engineer clearing it and typing a digit.
      if (e.target.value.trim() === '') return;
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      cashOutHours = clampCashOutHours(v);
      patchCashOutFigures();
    });
    // focusout, because blur does not bubble and there is no element to bind.
    // Settles an emptied field back on the payable balance and tidies the
    // figure to two decimals.
    cashoutSheet.addEventListener('focusout', e => {
      if (!e.target.closest('#cashout-hours-input')) return;
      if (e.target.value.trim() === '' || isNaN(parseFloat(e.target.value))) {
        cashOutHours = null;
      }
      refreshSheetInPlace('cashout-sheet');
    });
    cashoutSheet.addEventListener('focusin', e => {
      if (e.target.closest('#cashout-hours-input')) e.target.select();
    });
  }

  // Modal
  const overlay = document.getElementById('modal-overlay');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirm = document.getElementById('modal-confirm');
  const modalInput = document.getElementById('modal-input');

  if (modalCancel) modalCancel.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  if (modalConfirm) modalConfirm.addEventListener('click', () => {
    const val = parseFloat(modalInput.value);
    if (!val || val <= 0) { modalInput.focus(); return; }
    const nameVal = (document.getElementById('modal-name').value || '').trim();
    logJob(pendingJob, val, nameVal);
    closeModal();
  });
  if (modalInput) {
    modalInput.addEventListener('keydown', e => { if (e.key === 'Enter') modalConfirm.click(); });
  }
}

// ── Job Logic ──────────────────────────────────────────────────────────────
// (findJob lives in data.cjs)

function openModal(job) {
  pendingJob = job;
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = job.name;
  document.getElementById('modal-desc').textContent = job.variablePrompt;
  const input = document.getElementById('modal-input');
  input.placeholder = job.variableType === 'hours' ? 'e.g. 2.5' : 'e.g. 45';
  input.value = '';
  const nameField = document.getElementById('modal-name');
  nameField.value = '';
  nameField.style.display = (job.isNpt && !job.skipNameField) ? 'block' : 'none';
  document.getElementById('modal-confirm').textContent = job.confirmLabel || (job.isNpt ? 'Log Absence' : 'Log Job');
  overlay.classList.remove('hidden');
  setTimeout(() => input.focus(), 100);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  pendingJob = null;
}

function logJob(job, variableValue, optionalName) {
  const targetDay = activeLogDay;
  const targetWeekKey = getWeekKey(new Date(targetDay + 'T00:00:00'));

  if (targetDay > getTodayKey()) {
    showToast('Cannot log to a future date');
    return;
  }

  // Mentor Support Full Day
  if (job.isMentorFull) {
    const week = getOrCreateWeek(state, targetWeekKey);
    if (!week.mentorDays) week.mentorDays = {};
    week.mentorDays[targetDay] = 'full';
    saveState(state);
    if (window.__ctapSyncWeek) window.__ctapSyncWeek(targetWeekKey);
    showToast('Mentor Support logged — full day');
    if (activeTab === 'log') renderKeepingScroll(); else render();
    return;
  }

  // Mentor Support 20% Reduction
  if (job.isMentorPartial) {
    const week = getOrCreateWeek(state, targetWeekKey);
    if (!week.mentorDays) week.mentorDays = {};
    week.mentorDays[targetDay] = 'partial';
    saveState(state);
    if (window.__ctapSyncWeek) window.__ctapSyncWeek(targetWeekKey);
    showToast('Mentor Support logged — 20%');
    if (activeTab === 'log') renderKeepingScroll(); else render();
    return;
  }

  // NPT / Early Finish: save as deduction, not a credit entry
  if (job.isNpt) {
    const mins = Math.round(variableValue);
    if (!mins || mins <= 0) return;
    const label = job.skipNameField ? job.name : (optionalName || 'Non-Productive Time');
    const week = getOrCreateWeek(state, targetWeekKey);
    if (!week.deductionLog) week.deductionLog = [];
    week.deductionLog.push({ name: label, mins, date: targetDay });
    week.deductionMins = (week.deductionMins || 0) + mins;
    saveState(state);
    if (window.__ctapSyncWeek) window.__ctapSyncWeek(targetWeekKey);
    showToast(label + ' — ' + mins + ' min');
    if (activeTab === 'log') renderKeepingScroll(); else render();
    return;
  }

  let creditMins;
  let variableDisplay = null;

  if (job.variable && variableValue !== null) {
    if (job.variableType === 'hours') {
      creditMins = job.minutes * variableValue;
      variableDisplay = `${variableValue}h`;
    } else {
      creditMins = variableValue;
      variableDisplay = `${variableValue}min`;
    }
  } else {
    creditMins = job.minutes;
  }

  const entry = {
    id: job.id,
    name: job.name,
    creditMins,
    variableInput: variableDisplay,
    ts: Date.now()
  };
  lastLoggedTs = entry.ts;

  const week = getOrCreateWeek(state, targetWeekKey);
  const day = getOrCreateDay(week, targetDay);
  day.push(entry);
  saveState(state);
  if (window.__ctapSyncWeek) window.__ctapSyncWeek(targetWeekKey);

  const displayName = job.name.replace(/\s*\(.*$/, '');
  const backfillNote = targetDay !== getTodayKey() ? ' (backdated)' : '';
  showToast(displayName + ' added' + backfillNote);
  if (activeTab === 'log') renderKeepingScroll(); else render();
}

// ── Coach Mode ─────────────────────────────────────────────────────────────
// (isCoachModeOn, getElectiveJobs, getHistoricallyStrongDay live in data.cjs)

function buildCtapTrend() {
  const todayWk = getWeekKey(new Date());
  const pastWks = Object.keys(state.weeks)
    .filter(wk => wk < todayWk && !state.weeks[wk].excludeFromCtap)
    .sort().slice(-6);
  if (pastWks.length < 3) return '';
  const netChange = pastWks.reduce((sum, wk) => {
    return sum + weekCreditHours(state.weeks[wk]) - weekTargetHours(state, wk);
  }, 0);
  const arrow = netChange > 0.3 ? '↑' : netChange < -0.3 ? '↓' : '→';
  const cls = netChange > 0.3 ? ' green' : netChange < -0.3 ? ' red' : '';
  const sign = netChange >= 0 ? '+' : '';
  return `<div class="ctap-trend-row">
    <span class="ctap-trend-label">CTAP Trend</span>
    <span class="ctap-trend-val${cls}">${arrow} ${sign}${netChange.toFixed(2)}h over ${pastWks.length} weeks</span>
  </div>`;
}

// Recovering a deficit is about the part of the week the engineer controls,
// and that is SGO — not chasing a job code dispatch has to hand you. Framed as
// what's on offer at every visit rather than as a single job to go and find.
function sgoNudge() {
  const elective = getElectiveJobs();
  if (!elective.length) return 'Sales credits are the part of the week you control — they add up faster than they look.';
  const best = elective.reduce((b, j) => j.minutes > b.minutes ? j : b, elective[0]);
  const n = best.name.replace(/\s*\(.*$/, '').trim();
  return `Sales credits are the part of the week you choose — a ${n} is ${(best.minutes/60).toFixed(2)}h, on a visit you're already making.`;
}

function buildCoachCard() {
  if (!isCoachModeOn()) return '';
  const todayWk = getWeekKey(new Date());
  const week = state.weeks[todayWk] || { days: {}, shifts: {} };
  const bal = cumulativeBalance(state);
  const earnedHours = weekCreditHours(week);
  const targetHours = weekTargetHours(state, todayWk);
  const bonus = earnedHours >= targetHours;
  const pastWks = Object.keys(state.weeks).filter(wk => wk < todayWk).sort();
  const msgs = [];

  // Coach sits directly above the two tiles, and since ADR-0023 those tiles
  // lead with the predicted week. Reading the banked balance here without
  // saying so put "You're in credit" above a tile marked Deficit, off the same
  // stored jobs — and the advice attached to it, "stay consistent", was the
  // very thing spending the credit. Coach reads the same figures now, and
  // where it does mean the banked balance it says banked.
  const pace = weekPaceFigures(todayWk, week);
  const canPredict = pace.projected !== null && !pace.isSettled;

  if (bal < -0.05) {
    const deficitH = Math.abs(bal);
    const extraPerDay = deficitH / 20;
    // "from closed weeks" is not padding: on a strong week the tile beside
    // this line predicts a credit, and without it the two read as rival
    // answers to one question rather than two different questions.
    msgs.push(`You're ${deficitH.toFixed(2)}h in deficit from closed weeks. To clear it in 4 weeks, aim for +${extraPerDay.toFixed(2)}h above target each day.`);
    const lastWkKey = pastWks.filter(wk => !state.weeks[wk].excludeFromCtap).pop();
    if (lastWkKey) {
      const lastWk = state.weeks[lastWkKey];
      const contrib = weekCreditHours(lastWk) - weekTargetHours(state, lastWkKey);
      if (contrib >= 0.05) {
        msgs.push(`Your deficit reduced by ${contrib.toFixed(2)}h last week — you're moving in the right direction.`);
      } else if (contrib < -0.05) {
        msgs.push(`Your deficit grew slightly last week. One strong day can start turning that around.`);
      } else {
        msgs.push(sgoNudge());
      }
    } else {
      msgs.push(sgoNudge());
    }
  } else if (!bonus && targetHours > 0.05) {
    // Three different engineers reach this branch: one genuinely in credit, one
    // sitting at zero with weeks behind them, and one who installed the app this
    // morning. Telling the last of those that consistency "protects your balance"
    // points at a balance that does not exist yet, and is the first thing the app
    // ever says to them.
    if (bal > 0.05 && canPredict && pace.projGap < -0.05) {
      // The old line here was "staying consistent this week protects your
      // balance". At 2h a day against a 32h target, staying consistent is
      // exactly what spends the credit — the reassurance was attached to the
      // behaviour causing the problem.
      msgs.push(`You're ${bal.toFixed(2)}h in credit from closed weeks, but this week's pace gives ${Math.abs(pace.projGap).toFixed(2)}h of it back.`);
    } else if (bal > 0.05 && canPredict) {
      msgs.push(`You're ${bal.toFixed(2)}h in credit from closed weeks, and this week's pace holds it. Keep going.`);
    } else if (bal > 0.05) {
      msgs.push(`You're in credit — staying consistent this week protects your balance.`);
    } else if (!pastWks.length && earnedHours < 0.05) {
      msgs.push(`Nothing logged yet, so the balance below is still zero. It starts moving the first time you log a job.`);
    } else if (!pastWks.length) {
      // The balance only moves when a week completes, so an engineer in their
      // first week is looking at a zero that their logging has not failed to
      // change — it has not had the chance yet.
      msgs.push(canPredict
        ? `First week in. The balance below is this week's pace projected forward — it only banks when the week closes.`
        : `First week in. The balance below moves when this week closes, not as you log.`);
    } else {
      msgs.push(canPredict
        ? `Your banked balance is level — neither in credit nor in deficit. A week above target puts you in front.`
        : `You're level — neither in credit nor in deficit. A week above target puts you in front.`);
    }
    // This counted every working day from today on, including one already
    // logged, while the Forecast sheet two inches below counted only the empty
    // ones — "3 remaining days" over "Days left 2" on one screen. One count.
    const remainDays = pace.daysRemaining;
    const needed = targetHours - earnedHours;
    if (needed > 0.05 && remainDays > 0) {
      msgs.push(`You need ${needed.toFixed(2)}h across ${remainDays} remaining day${remainDays === 1 ? '' : 's'} to hit this week's target.`);
    }
  } else if (bonus) {
    let streak = 0;
    for (let i = pastWks.length - 1; i >= 0; i--) {
      const w = state.weeks[pastWks[i]];
      if (!w || !bonusAchieved(state, pastWks[i])) break;
      streak++;
    }
    streak++; // include current week
    if (streak >= 2) {
      msgs.push(`You've hit target ${streak} weeks in a row — great consistency.`);
    } else {
      // Was a third copy of the projection, working the same predicates out
      // again. weekPaceFigures is the one answer the tile and the sheet print.
      if (canPredict) {
        msgs.push(`At your current pace, you'll finish on ${pace.projected.toFixed(2)} hours. This is ${pace.projGap.toFixed(2)} hours above target.`);
      } else {
        msgs.push(`Banked CTAP balance: +${bal.toFixed(2)}h — you're in credit. Keep the consistency going.`);
      }
    }
    const strongDay = getHistoricallyStrongDay(state);
    if (strongDay) {
      msgs.push(`${strongDay} is typically your strongest day — a good one to push for more.`);
    } else if (bal > 0.05) {
      msgs.push(`Banked CTAP balance: +${bal.toFixed(2)}h in credit. Keep the consistency going.`);
    }
  }

  if (!msgs.length) return '';
  return `<div class="coach-card">
    <div class="coach-card-header">
      <div class="coach-eng" id="coach-eng" aria-hidden="true"></div>
      <span class="coach-label">Coach</span>
    </div>
    ${msgs.map(m => `<div class="coach-msg">${m}</div>`).join('')}
  </div>`;
}

function buildDeficitClearedCard() {
  if (!isCoachModeOn()) return '';
  if (localStorage.getItem('jcpd_deficit_cleared_seen') === 'true') return '';
  const bal = cumulativeBalance(state);
  if (bal < 0) return '';
  const todayWk = getWeekKey(new Date());
  const pastWks = Object.keys(state.weeks)
    .filter(wk => wk < todayWk && !state.weeks[wk].excludeFromCtap)
    .sort();
  if (pastWks.length < 1) return '';
  const lastWkKey = pastWks[pastWks.length - 1];
  const lastWk = state.weeks[lastWkKey];
  const lastContrib = weekCreditHours(lastWk) - weekTargetHours(state, lastWkKey);
  const prevBal = bal - lastContrib;
  if (prevBal >= 0) return '';
  return `<div class="coach-card coach-card-celebration" id="deficit-cleared-card">
    <button class="coach-card-dismiss" id="dismiss-deficit-cleared">✕</button>
    <div class="coach-celebrate-check">✓</div>
    <div class="coach-msg">You're back in credit. ${pastWks.length} week${pastWks.length === 1 ? '' : 's'} of consistent work got you here — well done.</div>
  </div>`;
}

function buildBestAdviceStrip(stillNeeded, todayJobs, week, todayKey) {
  if (!isCoachModeOn()) return '';
  // Deliberately NOT hidden once today's target is hit: best advice on the next
  // visit is extra credit, and extra credit builds the CTAP balance.

  // Check shift status: not complete and > 30 min remaining
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const sh = (week.shifts || {})[todayKey] || {};
  let endM = 990; // default 16:30
  if (sh.end) {
    const [eh, em] = sh.end.split(':').map(Number);
    endM = eh * 60 + em;
  }
  if (cur >= endM) return '';
  if (endM - cur < 30) return '';

  // Every opportunity that applies, each dismissible for the day on its own.
  const opps = getBestAdviceOpportunities(todayJobs.map(j => j.id))
    .filter(o => localStorage.getItem(`jcpd_coach_opp_${todayKey}_${o.id}`) !== 'true');
  if (!opps.length) return '';

  // Credit in hours (catalogue minutes / 60), the unit every other figure on the
  // Dashboard uses — not the sheet's 83.58-minute "credits".
  const rows = opps.map(o => {
    const hrs = o.minutes ? o.minutes / 60 : null;
    const credit = hrs === null ? ''
      : `+${hrs.toFixed(2)}h${stillNeeded > 0 ? ` · ${Math.round((hrs / stillNeeded) * 100)}% of today's gap` : ''}`;
    return `<li class="coach-opp-row" data-opp-row="${o.id}">
      <div class="coach-opp-body">
        <span class="coach-opp-line">${o.name}${credit ? ` <span class="coach-opp-credit">${credit}</span>` : ''}</span>
        <span class="coach-opp-why">${o.why}</span>
      </div>
      <button class="coach-opp-dismiss" data-dismiss-opp="${o.id}" data-dismiss-day="${todayKey}" aria-label="Dismiss ${o.name} for today">✕</button>
    </li>`;
  }).join('');

  return `<div class="coach-opp-strip" id="coach-opp-strip">
    <span class="coach-opp-label">Best advice</span>
    <ul class="coach-opp-list">${rows}</ul>
  </div>`;
}

// ── Utils ──────────────────────────────────────────────────────────────────
function sortedDays(week) {
  return Object.entries(week.days || {}).sort(([a], [b]) => b.localeCompare(a));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
function iconChart()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="13" width="4" height="8"/><rect x="10" y="9" width="4" height="12"/><rect x="17" y="5" width="4" height="16"/></svg>`; }
function iconPlus()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`; }
function iconSearch()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>`; }
function iconMic()      { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/></svg>`; }
function iconCalendar() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`; }
function iconClock()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>`; }
function iconGear()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`; }
