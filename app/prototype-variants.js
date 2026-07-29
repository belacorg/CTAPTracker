// ─────────────────────────────────────────────────────────────────────────
// PROTOTYPE — THROWAWAY. Delete this file once a variant wins.
//
// Question: what should Log Job and Dashboard look like? The current Log page
// gives its best space to the least-used things (date picker, search) and
// squeezes the most-used (recents), while every tile carries codes that matter
// occasionally and shout constantly.
//
// Three variants of each page, switchable via ?variant=A|B|C on the real pages
// with real data. Read-only: tapping a job shows what *would* be logged and
// writes nothing.
//
// Notes + verdict: docs/prototype-notes.md
// ─────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  var VARIANTS = {
    A: { log: 'Top jobs first', dash: 'One number' },
    B: { log: 'Voice first',    dash: 'Week shape' },
    C: { log: 'Categories',     dash: 'Today first' }
  };
  var KEYS = ['A', 'B', 'C'];

  var protoCat = null;      // open category in Log C
  var protoOpen = {};       // open accordions in Dash A

  // ── Which variant, if any ────────────────────────────────────────────────
  var _variant = null;
  try {
    var q = new URLSearchParams(window.location.search).get('variant');
    if (q && KEYS.indexOf(q.toUpperCase()) !== -1) _variant = q.toUpperCase();
  } catch (e) {}

  window.__protoVariant = function () { return _variant; };

  window.__protoSetVariant = function (v) {
    _variant = v;
    protoCat = null;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('variant', v);
      window.history.replaceState({}, '', url);
    } catch (e) {}
    if (render) render();
  };

  // ── Shared helpers ───────────────────────────────────────────────────────
  function meta(id) { return (JOB_META || {})[id] || {}; }
  function shortName(job) { return meta(job.id).short || job.name.replace(/\s*[\(\–\-].*$/, '').trim(); }
  function sub(job) { return meta(job.id).sub || ''; }
  function credit(job) {
    if (job.variable) return 'Variable';
    if (job.isMentorFull) return 'Full day';
    if (job.isMentorPartial) return '−20%';
    if (job.isNpt) return 'NPT';
    return '+' + (job.minutes / 60).toFixed(2) + 'h';
  }

  // Most-logged jobs across all history, falling back to a sensible starter set
  // so a new engineer doesn't open an empty page.
  function topJobs(n) {
    var counts = {};
    var weeks = (state && state.weeks) || {};
    Object.keys(weeks).forEach(function (wk) {
      var days = weeks[wk].days || {};
      Object.keys(days).forEach(function (dk) {
        (days[dk] || []).forEach(function (e) {
          if (e && e.id) counts[e.id] = (counts[e.id] || 0) + 1;
        });
      });
    });
    var ranked = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    var fallback = ['asv_chb_cir_wh_swh', 'gas_repair', 'asv_fre', 'fv_chb', 'ib_ff', 'as_inst'];
    fallback.forEach(function (id) { if (ranked.indexOf(id) === -1) ranked.push(id); });
    var out = [];
    for (var i = 0; i < ranked.length && out.length < n; i++) {
      var j = findJob(ranked[i]);
      if (j) out.push({ job: j, count: counts[ranked[i]] || 0 });
    }
    return out;
  }

  function dayLabelShort(key) {
    if (key === getTodayKey()) return 'Today';
    return new Date(key + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function sessionLine() {
    var day = activeLogDay;
    var wkKey = getWeekKey(new Date(day + 'T00:00:00'));
    var wk = (state.weeks || {})[wkKey] || { days: {} };
    var jobs = (wk.days || {})[day] || [];
    if (jobs.length === 0) return '';
    var hrs = jobs.reduce(function (s, j) { return s + j.creditMins; }, 0) / 60;
    return '<div class="pt-session"><span>' + jobs.length + ' logged today</span>' +
           '<span class="pt-session-val">+' + hrs.toFixed(2) + 'h</span></div>';
  }

  function micIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/></svg>';
  }
  function searchIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>';
  }

  // ═════════════════════════════ LOG JOB ═══════════════════════════════════

  // A — Top jobs first. The six you actually log, big enough for gloves;
  // the full catalogue is one tap away behind "All jobs".
  function logA() {
    var tiles = topJobs(6).map(function (t) {
      var sb = sub(t.job);
      return '<button class="pa-tile" data-proto-job="' + t.job.id + '">' +
        '<span class="pa-tile-top"><span class="pa-tile-name">' + shortName(t.job) + '</span>' +
        (sb ? '<span class="pa-tile-sub">' + sb + '</span>' : '') + '</span>' +
        '<span class="pa-tile-credit">' + credit(t.job) + '</span>' +
        '</button>';
    }).join('');

    return '' +
      '<div class="pa-bar">' +
        '<button class="pa-day" data-proto="day">' + dayLabelShort(activeLogDay) + '</button>' +
        '<button class="pa-mic" data-proto="mic">' + micIcon() + '<span>Voice</span></button>' +
      '</div>' +
      '<div class="pa-grid">' + tiles + '</div>' +
      '<button class="pa-all" data-proto="all">All job types<span class="pa-all-chev">›</span></button>' +
      sessionLine();
  }

  // B — Voice first. Voice is the fastest path, so it leads; everything else
  // is a plain scannable list with no codes competing for attention.
  function logB() {
    var recents = (getRecentJobs(state, 5) || []).map(function (j) {
      var sb = sub(j);
      return '<button class="pb-chip" data-proto-job="' + j.id + '">' +
        '<span class="pb-chip-name">' + shortName(j) + '</span>' +
        (sb ? '<span class="pb-chip-sub">' + sb + '</span>' : '') +
        '<span class="pb-chip-credit">' + credit(j) + '</span></button>';
    }).join('');

    var cats = [['core', 'Gas'], ['hive', 'Hive'], ['sales', 'SGO'], ['absent', 'Absence']];
    var list = cats.map(function (c) {
      var rows = (JOB_TYPES[c[0]] || []).map(function (j) {
        var sb = sub(j);
        return '<button class="pb-row" data-proto-job="' + j.id + '">' +
          '<span class="pb-row-main"><span class="pb-row-name">' + shortName(j) + '</span>' +
          (sb ? '<span class="pb-row-sub">' + sb + '</span>' : '') + '</span>' +
          '<span class="pb-row-credit">' + credit(j) + '</span></button>';
      }).join('');
      return '<div class="pb-sec">' + c[1] + '</div><div class="pb-list">' + rows + '</div>';
    }).join('');

    return '' +
      '<div class="pb-head">' +
        '<span class="pb-date" data-proto="day">' + dayLabelShort(activeLogDay) + '</span>' +
        '<button class="pb-icon" data-proto="search">' + searchIcon() + '</button>' +
      '</div>' +
      '<button class="pb-voice" data-proto="mic">' +
        '<span class="pb-voice-ico">' + micIcon() + '</span>' +
        '<span class="pb-voice-txt"><strong>Say what you’ve done</strong>' +
        '<small>“six breakdowns, two boiler leads”</small></span>' +
      '</button>' +
      (recents ? '<div class="pb-sec">Recent</div><div class="pb-chips">' + recents + '</div>' : '') +
      list +
      sessionLine();
  }

  // C — Categories. Almost nothing on screen until you choose; two taps to any
  // job, and density is capped at one category at a time.
  function logC() {
    var recents = (getRecentJobs(state, 4) || []).map(function (j) {
      var sb = sub(j);
      return '<button class="pc-recent-chip" data-proto-job="' + j.id + '">' +
        '<span class="pc-recent-name">' + shortName(j) + '</span>' +
        (sb ? '<span class="pc-recent-sub">' + sb + '</span>' : '') + '</button>';
    }).join('');

    var head = '' +
      '<div class="pc-head">' +
        '<button class="pc-day" data-proto="day">' + dayLabelShort(activeLogDay) + '</button>' +
        '<div class="pc-head-actions">' +
          '<button class="pc-icon" data-proto="search">' + searchIcon() + '</button>' +
          '<button class="pc-mic" data-proto="mic">' + micIcon() + '</button>' +
        '</div>' +
      '</div>';

    if (protoCat) {
      var names = { core: 'Gas', hive: 'Hive', sales: 'SGO', absent: 'Absence' };
      var rows = (JOB_TYPES[protoCat] || []).map(function (j) {
        var m = meta(j.id);
        return '<button class="pc-row" data-proto-job="' + j.id + '">' +
          '<span class="pc-row-main"><span class="pc-row-name">' + shortName(j) + '</span>' +
          (m.sub ? '<span class="pc-row-sub">' + m.sub + '</span>' : '') + '</span>' +
          '<span class="pc-row-credit">' + credit(j) + '</span></button>';
      }).join('');
      return head +
        '<button class="pc-back" data-proto="back">‹ All categories</button>' +
        '<div class="pc-cat-title">' + names[protoCat] + '</div>' +
        '<div class="pc-list">' + rows + '</div>' + sessionLine();
    }

    var cards = [
      { k: 'core', n: 'Gas', d: 'Services, repairs, first visits' },
      { k: 'hive', n: 'Hive', d: 'Thermostats, TRVs, zones' },
      { k: 'sales', n: 'SGO', d: 'Quotes, leads, inhibitor' },
      { k: 'absent', n: 'Absence', d: 'Wait work, NPT, mentoring' }
    ].map(function (c) {
      return '<button class="pc-card" data-proto-cat="' + c.k + '">' +
        '<span class="pc-card-name">' + c.n + '</span>' +
        '<span class="pc-card-desc">' + c.d + '</span>' +
        '<span class="pc-card-count">' + (JOB_TYPES[c.k] || []).length + '</span></button>';
    }).join('');

    return head +
      (recents ? '<div class="pc-recent">' + recents + '</div>' : '') +
      '<div class="pc-cards">' + cards + '</div>' + sessionLine();
  }

  // ═════════════════════════════ DASHBOARD ═════════════════════════════════

  function dashData() {
    var wkKey = currentWeekKey;
    var week = getOrCreateWeek(state, wkKey);
    var earned = weekCreditHours(week);
    var eff = effectiveTargetHours(state, week, wkKey);
    var target = eff.hours;
    var pct = target > 0 ? Math.min((earned / target) * 100, 100) : 0;
    var todayKey = getTodayKey();
    var pctFactor = typeof state.weeklyTargetPct === 'number' ? state.weeklyTargetPct : 0.8;
    var todayDed = (week.deductionLog || []).filter(function (d) { return d.date === todayKey; })
      .reduce(function (s, d) { return s + d.mins; }, 0);
    var dailyTarget = Math.max(0, getDailyTarget(state, week, todayKey) * pctFactor - todayDed / 60);
    var todayJobs = (week.days || {})[todayKey] || [];
    var todayHours = todayJobs.reduce(function (s, j) { return s + j.creditMins; }, 0) / 60;
    return {
      week: week, wkKey: wkKey, earned: earned, target: target, pct: pct,
      remaining: Math.max(0, target - earned),
      balance: cumulativeBalance(state),
      rostered: rosteredHours(state, week),
      todayHours: todayHours, dailyTarget: dailyTarget,
      todayCount: todayJobs.length,
      dedMins: week.deductionMins || 0,
      onTrack: earned >= target
    };
  }

  function dayBars(d) {
    var days = weekDays(d.wkKey).slice(0, 6);
    var vals = days.map(function (dk) {
      var jobs = (d.week.days || {})[dk] || [];
      return { dk: dk, h: jobs.reduce(function (s, j) { return s + j.creditMins; }, 0) / 60, n: jobs.length };
    });
    var max = Math.max.apply(null, vals.map(function (v) { return v.h; }).concat([1]));
    return { vals: vals, max: max };
  }

  // A — One number. The week's position is the headline; everything else folds
  // away until asked for.
  function dashA() {
    var d = dashData();
    var R = 52, C = 2 * Math.PI * R;
    var dash = (d.pct / 100) * C;
    var colour = d.pct >= 85 ? 'var(--green)' : d.pct >= 60 ? 'var(--amber)' : 'var(--red)';

    function acc(key, title, body) {
      var open = !!protoOpen[key];
      return '<button class="pda-acc" data-proto-acc="' + key + '">' + title +
        '<span class="pda-acc-chev">' + (open ? '⌃' : '⌄') + '</span></button>' +
        (open ? '<div class="pda-acc-body">' + body + '</div>' : '');
    }

    var bars = dayBars(d);
    var daysBody = bars.vals.map(function (v) {
      var name = new Date(v.dk + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' });
      return '<div class="pda-day"><span class="pda-day-n">' + name + '</span>' +
        '<span class="pda-day-bar"><i style="width:' + Math.round((v.h / bars.max) * 100) + '%"></i></span>' +
        '<span class="pda-day-v">' + (v.h > 0 ? v.h.toFixed(2) + 'h' : '—') + '</span></div>';
    }).join('');

    return '' +
      '<div class="pda-hero">' +
        '<svg class="pda-ring" viewBox="0 0 120 120">' +
          '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="var(--surface3)" stroke-width="10"/>' +
          '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="' + colour + '" stroke-width="10" ' +
            'stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + ' ' + C.toFixed(1) + '" ' +
            'transform="rotate(-90 60 60)"/>' +
        '</svg>' +
        '<div class="pda-hero-mid"><span class="pda-pct">' + Math.round(d.pct) + '</span><span class="pda-pct-sym">%</span></div>' +
      '</div>' +
      '<div class="pda-verdict" style="color:' + colour + '">' +
        (d.onTrack ? 'Week target met' : d.remaining.toFixed(2) + 'h to go') + '</div>' +
      '<div class="pda-sub">' + d.earned.toFixed(2) + 'h of ' + d.target.toFixed(2) + 'h</div>' +
      '<div class="pda-chips">' +
        '<div class="pda-chip"><span class="pda-chip-l">Balance</span><span class="pda-chip-v" style="color:' +
          (d.balance >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (d.balance >= 0 ? '+' : '') + d.balance.toFixed(1) + 'h</span></div>' +
        '<div class="pda-chip"><span class="pda-chip-l">Today</span><span class="pda-chip-v">' + d.todayHours.toFixed(2) + 'h</span></div>' +
        '<div class="pda-chip"><span class="pda-chip-l">Rostered</span><span class="pda-chip-v">' + d.rostered.toFixed(0) + 'h</span></div>' +
      '</div>' +
      acc('days', 'This week, day by day', daysBody) +
      acc('npt', 'Non-productive time', '<div class="pda-plain">' + (d.dedMins || 0) + ' min logged this week</div>') +
      acc('bal', 'CTAP balance', '<div class="pda-plain">Standing position: <b>' + d.balance.toFixed(2) + 'h</b></div>');
  }

  // B — Week shape. The week as a row of days you read at a glance, then the
  // detail underneath. No single hero number.
  function dashB() {
    var d = dashData();
    var bars = dayBars(d);
    var strip = bars.vals.map(function (v) {
      var name = new Date(v.dk + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'narrow' });
      var isToday = v.dk === getTodayKey();
      return '<div class="pdb-col' + (isToday ? ' today' : '') + '">' +
        '<div class="pdb-col-bar"><i style="height:' + Math.round((v.h / bars.max) * 100) + '%"></i></div>' +
        '<div class="pdb-col-n">' + name + '</div></div>';
    }).join('');

    var rows = bars.vals.filter(function (v) { return v.n > 0; }).map(function (v) {
      var name = new Date(v.dk + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
      return '<div class="pdb-row"><span class="pdb-row-n">' + name + '</span>' +
        '<span class="pdb-row-c">' + v.n + ' job' + (v.n === 1 ? '' : 's') + '</span>' +
        '<span class="pdb-row-v">' + v.h.toFixed(2) + 'h</span></div>';
    }).join('') || '<div class="pdb-empty">Nothing logged this week yet</div>';

    var pctColour = d.pct >= 85 ? 'var(--green)' : d.pct >= 60 ? 'var(--amber)' : 'var(--red)';

    return '' +
      '<div class="pdb-card">' +
        '<div class="pdb-top"><span class="pdb-earned">' + d.earned.toFixed(2) + 'h</span>' +
        '<span class="pdb-target">of ' + d.target.toFixed(2) + 'h</span></div>' +
        '<div class="pdb-track"><i style="width:' + d.pct + '%;background:' + pctColour + '"></i></div>' +
        '<div class="pdb-strip">' + strip + '</div>' +
      '</div>' +
      '<div class="pdb-stats">' +
        '<div class="pdb-stat"><span class="pdb-stat-v" style="color:' + (d.balance >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
          (d.balance >= 0 ? '+' : '') + d.balance.toFixed(1) + 'h</span><span class="pdb-stat-l">CTAP balance</span></div>' +
        '<div class="pdb-stat"><span class="pdb-stat-v">' + d.remaining.toFixed(2) + 'h</span><span class="pdb-stat-l">Still to earn</span></div>' +
      '</div>' +
      '<div class="pdb-sec">Days logged</div>' +
      '<div class="pdb-rows">' + rows + '</div>';
  }

  // C — Today first. What matters in the van is today's number; the week is
  // context underneath it.
  function dashC() {
    var d = dashData();
    var delta = d.todayHours - d.dailyTarget;
    var ok = delta >= 0;
    var bars = dayBars(d);

    var strip = bars.vals.map(function (v) {
      var name = new Date(v.dk + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'narrow' });
      var isToday = v.dk === getTodayKey();
      return '<div class="pdc-cell' + (isToday ? ' today' : '') + '">' +
        '<span class="pdc-cell-n">' + name + '</span>' +
        '<span class="pdc-cell-v">' + (v.h > 0 ? v.h.toFixed(1) : '·') + '</span></div>';
    }).join('');

    return '' +
      '<div class="pdc-today">' +
        '<div class="pdc-today-l">Today</div>' +
        '<div class="pdc-today-big">' + d.todayHours.toFixed(2) + '<span>h</span></div>' +
        '<div class="pdc-today-sub" style="color:' + (ok ? 'var(--green)' : 'var(--amber)') + '">' +
          (ok ? 'Daily target met' : (d.dailyTarget - d.todayHours).toFixed(2) + 'h to daily target') + '</div>' +
        '<div class="pdc-today-meta">' + d.todayCount + ' job' + (d.todayCount === 1 ? '' : 's') +
          ' · target ' + d.dailyTarget.toFixed(2) + 'h</div>' +
      '</div>' +
      '<div class="pdc-strip">' + strip + '</div>' +
      '<div class="pdc-tiles">' +
        '<div class="pdc-tile"><span class="pdc-tile-l">This week</span>' +
          '<span class="pdc-tile-v">' + d.earned.toFixed(2) + 'h</span>' +
          '<span class="pdc-tile-s">of ' + d.target.toFixed(2) + 'h</span></div>' +
        '<div class="pdc-tile"><span class="pdc-tile-l">Balance</span>' +
          '<span class="pdc-tile-v" style="color:' + (d.balance >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
          (d.balance >= 0 ? '+' : '') + d.balance.toFixed(1) + 'h</span>' +
          '<span class="pdc-tile-s">standing</span></div>' +
      '</div>';
  }

  // ── Entry points used by app.js ──────────────────────────────────────────
  window.__protoLog = function (v) { return v === 'A' ? logA() : v === 'B' ? logB() : logC(); };
  window.__protoDash = function (v) { return v === 'A' ? dashA() : v === 'B' ? dashB() : dashC(); };

  window.__protoSwitcher = function (v) {
    var tab = activeTab;
    var name = tab === 'dashboard' ? VARIANTS[v].dash : VARIANTS[v].log;
    var scope = tab === 'dashboard' ? 'Dashboard' : tab === 'log' ? 'Log Job' : 'not prototyped';
    return '<div class="proto-bar">' +
      '<button class="proto-arrow" data-proto-nav="-1" aria-label="Previous variant">‹</button>' +
      '<span class="proto-label"><span class="proto-label-main"><b>' + v + '</b> — ' + name + '</span>' +
      '<small>' + scope + '</small></span>' +
      '<button class="proto-arrow" data-proto-nav="1" aria-label="Next variant">›</button>' +
      '</div>';
  };

  window.__protoAttach = function () {
    document.querySelectorAll('[data-proto-nav]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = KEYS.indexOf(_variant);
        var next = KEYS[(i + parseInt(b.dataset.protoNav, 10) + KEYS.length) % KEYS.length];
        window.__protoSetVariant(next);
      });
    });
    document.querySelectorAll('[data-proto-cat]').forEach(function (b) {
      b.addEventListener('click', function () { protoCat = b.dataset.protoCat; render(); });
    });
    document.querySelectorAll('[data-proto-acc]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.protoAcc;
        protoOpen[k] = !protoOpen[k];
        render();
      });
    });
    document.querySelectorAll('[data-proto]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.proto;
        if (a === 'back') { protoCat = null; render(); return; }
        if (a === 'mic') { openVoiceSheet(); return; }
        showToast('Prototype — “' + a + '” not wired up');
      });
    });
    // Read-only: show what would be logged, write nothing.
    document.querySelectorAll('[data-proto-job]').forEach(function (b) {
      b.addEventListener('click', function () {
        var j = findJob(b.dataset.protoJob);
        if (j) showToast('Would log: ' + shortName(j) + ' ' + credit(j));
      });
    });
  };

  // ── Styles (kept in-file so deleting the prototype is one `rm`) ──────────
  var css = `
  .proto-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(78px + env(safe-area-inset-bottom,0px));
    z-index:400;display:flex;align-items:center;gap:4px;background:#fff;color:#000;border-radius:99px;
    padding:5px 6px;box-shadow:0 6px 24px rgba(0,0,0,.45);font-family:var(--jcpd-font-sans)}
  .proto-arrow{width:32px;height:32px;border:none;background:#eceff3;color:#000;border-radius:50%;
    font-size:1.1rem;line-height:1;cursor:pointer}
  .proto-arrow:active{background:#dfe3e9}
  .proto-label{display:flex;flex-direction:column;align-items:center;line-height:1.2;padding:0 10px;font-size:.8rem;font-weight:600;white-space:nowrap}
  .proto-label-main{white-space:nowrap}
  .proto-label small{font-size:.66rem;font-weight:500;color:#6b7280}

  /* ── Log A ── */
  .pa-bar{display:flex;gap:10px;margin-bottom:14px}
  .pa-day{flex:1;background:var(--surface2);border:none;border-radius:12px;color:var(--fg);
    font-size:.9rem;font-weight:600;font-family:inherit;padding:12px;cursor:pointer}
  .pa-mic{flex:0 0 auto;display:flex;align-items:center;gap:7px;background:var(--accent);color:#fff;border:none;
    border-radius:12px;padding:12px 16px;font-size:.9rem;font-weight:600;font-family:inherit;cursor:pointer}
  .pa-mic svg{width:18px;height:18px}
  .pa-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .pa-tile{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:10px;
    min-height:108px;background:var(--surface);border:1.5px solid var(--tile-border);border-radius:16px;
    padding:14px;text-align:left;cursor:pointer;font-family:inherit}
  .pa-tile:active{background:var(--surface2)}
  .pa-tile-top{display:flex;flex-direction:column;gap:3px}
  .pa-tile-name{font-size:1rem;font-weight:600;color:var(--fg);line-height:1.25}
  .pa-tile-sub{font-size:.73rem;color:var(--muted2);line-height:1.25}
  .pa-tile-credit{font-family:var(--jcpd-font-mono);font-size:.9rem;font-weight:600;color:var(--green)}
  .pa-all{width:100%;display:flex;align-items:center;justify-content:space-between;margin-top:12px;
    background:var(--surface2);border:none;border-radius:12px;padding:15px 16px;color:var(--fg);
    font-size:.92rem;font-weight:600;font-family:inherit;cursor:pointer}
  .pa-all-chev{color:var(--muted);font-size:1.2rem}

  /* ── Log B ── */
  .pb-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .pb-date{font-size:.86rem;font-weight:600;color:var(--muted)}
  .pb-icon{width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--surface2);
    border:none;border-radius:10px;color:var(--fg);cursor:pointer}
  .pb-icon svg{width:17px;height:17px}
  .pb-voice{width:100%;display:flex;align-items:center;gap:14px;background:var(--accent);color:#fff;border:none;
    border-radius:16px;padding:16px;text-align:left;cursor:pointer;font-family:inherit}
  .pb-voice-ico{width:42px;height:42px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;
    background:rgba(255,255,255,.2);border-radius:50%}
  .pb-voice-ico svg{width:21px;height:21px}
  .pb-voice-txt{display:flex;flex-direction:column;gap:2px}
  .pb-voice-txt strong{font-size:1rem;font-weight:700}
  .pb-voice-txt small{font-size:.76rem;opacity:.85}
  .pb-sec{font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:20px 0 8px}
  .pb-chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
  .pb-chip{flex:0 0 auto;display:flex;flex-direction:column;gap:3px;background:var(--surface);
    border:1.5px solid var(--tile-border);border-radius:12px;padding:11px 14px;text-align:left;cursor:pointer;font-family:inherit}
  .pb-chip-name{font-size:.86rem;font-weight:600;color:var(--fg);white-space:nowrap}
  .pb-chip-sub{font-size:.7rem;color:var(--muted2);white-space:nowrap;max-width:130px;overflow:hidden;text-overflow:ellipsis}
  .pb-chip-credit{font-family:var(--jcpd-font-mono);font-size:.76rem;color:var(--green)}
  .pb-list{background:var(--surface);border-radius:14px;overflow:hidden}
  .pb-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;background:none;
    border:none;border-bottom:.5px solid var(--sep);padding:15px 14px;cursor:pointer;font-family:inherit}
  .pb-row:last-child{border-bottom:none}
  .pb-row:active{background:var(--surface2)}
  .pb-row-main{display:flex;flex-direction:column;gap:2px;text-align:left;min-width:0}
  .pb-row-name{font-size:.94rem;color:var(--fg);text-align:left}
  .pb-row-sub{font-size:.74rem;color:var(--muted2)}
  .pb-row-credit{font-family:var(--jcpd-font-mono);font-size:.84rem;color:var(--green);white-space:nowrap}

  /* ── Log C ── */
  .pc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
  .pc-day{background:var(--surface2);border:none;border-radius:10px;color:var(--fg);font-size:.86rem;
    font-weight:600;font-family:inherit;padding:10px 14px;cursor:pointer}
  .pc-head-actions{display:flex;gap:8px}
  .pc-icon,.pc-mic{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:none;
    border-radius:10px;cursor:pointer}
  .pc-icon{background:var(--surface2);color:var(--fg)}
  .pc-mic{background:var(--accent);color:#fff}
  .pc-icon svg,.pc-mic svg{width:18px;height:18px}
  .pc-recent{display:flex;gap:8px;overflow-x:auto;margin-bottom:16px}
  .pc-recent-chip{flex:0 0 auto;display:flex;flex-direction:column;gap:2px;align-items:flex-start;
    background:var(--surface2);border:none;border-radius:14px;padding:9px 14px;
    color:var(--fg);font-family:inherit;white-space:nowrap;cursor:pointer}
  .pc-recent-name{font-size:.83rem;font-weight:600}
  .pc-recent-sub{font-size:.68rem;color:var(--muted2);max-width:120px;overflow:hidden;text-overflow:ellipsis}
  .pc-cards{display:flex;flex-direction:column;gap:10px}
  .pc-card{position:relative;display:flex;flex-direction:column;gap:4px;background:var(--surface);
    border:1.5px solid var(--tile-border);border-radius:16px;padding:18px;text-align:left;cursor:pointer;font-family:inherit}
  .pc-card:active{background:var(--surface2)}
  .pc-card-name{font-size:1.12rem;font-weight:700;color:var(--fg)}
  .pc-card-desc{font-size:.8rem;color:var(--muted)}
  .pc-card-count{position:absolute;right:18px;top:50%;transform:translateY(-50%);font-family:var(--jcpd-font-mono);
    font-size:.9rem;color:var(--muted2)}
  .pc-back{background:none;border:none;color:var(--accent);font-size:.88rem;font-family:inherit;padding:0 0 10px;cursor:pointer}
  .pc-cat-title{font-size:1.15rem;font-weight:700;color:var(--fg);margin-bottom:10px}
  .pc-list{background:var(--surface);border-radius:14px;overflow:hidden}
  .pc-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;background:none;border:none;
    border-bottom:.5px solid var(--sep);padding:14px;cursor:pointer;font-family:inherit}
  .pc-row:last-child{border-bottom:none}
  .pc-row-main{display:flex;flex-direction:column;gap:2px;text-align:left}
  .pc-row-name{font-size:.94rem;color:var(--fg)}
  .pc-row-sub{font-size:.74rem;color:var(--muted2)}
  .pc-row-credit{font-family:var(--jcpd-font-mono);font-size:.84rem;color:var(--green);white-space:nowrap}

  .pt-session{display:flex;justify-content:space-between;margin-top:18px;padding-top:14px;
    border-top:.5px solid var(--sep);font-size:.84rem;color:var(--muted)}
  .pt-session-val{font-family:var(--jcpd-font-mono);font-weight:700;color:var(--green)}

  /* ── Dash A ── */
  .pda-hero{position:relative;width:180px;height:180px;margin:8px auto 0}
  .pda-ring{width:100%;height:100%}
  .pda-hero-mid{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  .pda-pct{font-family:var(--jcpd-font-mono);font-size:3rem;font-weight:700;color:var(--fg);line-height:1}
  .pda-pct-sym{font-size:1.2rem;color:var(--muted);margin-top:10px}
  .pda-verdict{text-align:center;font-size:1.05rem;font-weight:700;margin-top:4px}
  .pda-sub{text-align:center;font-size:.85rem;color:var(--muted);margin-top:4px}
  .pda-chips{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:20px 0 8px}
  .pda-chip{background:var(--surface);border-radius:12px;padding:12px 8px;text-align:center}
  .pda-chip-l{display:block;font-size:.7rem;color:var(--muted);margin-bottom:4px}
  .pda-chip-v{display:block;font-family:var(--jcpd-font-mono);font-size:.95rem;font-weight:700;color:var(--fg)}
  .pda-acc{width:100%;display:flex;align-items:center;justify-content:space-between;background:var(--surface);
    border:none;border-radius:12px;margin-top:8px;padding:15px 16px;color:var(--fg);font-size:.92rem;
    font-weight:600;font-family:inherit;cursor:pointer}
  .pda-acc-chev{color:var(--muted)}
  .pda-acc-body{background:var(--surface);border-radius:0 0 12px 12px;margin-top:-4px;padding:4px 16px 14px}
  .pda-day{display:flex;align-items:center;gap:10px;padding:7px 0}
  .pda-day-n{width:34px;font-size:.78rem;color:var(--muted)}
  .pda-day-bar{flex:1;height:7px;background:var(--surface3);border-radius:99px;overflow:hidden}
  .pda-day-bar i{display:block;height:100%;background:var(--accent);border-radius:99px}
  .pda-day-v{width:52px;text-align:right;font-family:var(--jcpd-font-mono);font-size:.78rem;color:var(--fg)}
  .pda-plain{font-size:.85rem;color:var(--muted);padding:6px 0}

  /* ── Dash B ── */
  .pdb-card{background:var(--surface);border-radius:16px;padding:18px}
  .pdb-top{display:flex;align-items:baseline;gap:8px}
  .pdb-earned{font-family:var(--jcpd-font-mono);font-size:2rem;font-weight:700;color:var(--fg)}
  .pdb-target{font-size:.88rem;color:var(--muted)}
  .pdb-track{height:9px;background:var(--surface3);border-radius:99px;overflow:hidden;margin:12px 0 18px}
  .pdb-track i{display:block;height:100%;border-radius:99px}
  .pdb-strip{display:flex;align-items:flex-end;gap:6px;height:74px}
  .pdb-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%}
  .pdb-col-bar{flex:1;width:100%;display:flex;align-items:flex-end;background:var(--surface2);border-radius:6px;overflow:hidden}
  .pdb-col-bar i{display:block;width:100%;background:var(--accent);border-radius:6px;min-height:3px}
  .pdb-col.today .pdb-col-bar i{background:var(--green)}
  .pdb-col-n{font-size:.7rem;color:var(--muted)}
  .pdb-col.today .pdb-col-n{color:var(--green);font-weight:700}
  .pdb-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
  .pdb-stat{background:var(--surface);border-radius:14px;padding:16px;text-align:center}
  .pdb-stat-v{display:block;font-family:var(--jcpd-font-mono);font-size:1.35rem;font-weight:700;color:var(--fg)}
  .pdb-stat-l{display:block;font-size:.74rem;color:var(--muted);margin-top:3px}
  .pdb-sec{font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:22px 0 8px}
  .pdb-rows{background:var(--surface);border-radius:14px;overflow:hidden}
  .pdb-row{display:flex;align-items:center;gap:10px;padding:14px;border-bottom:.5px solid var(--sep)}
  .pdb-row:last-child{border-bottom:none}
  .pdb-row-n{flex:1;font-size:.9rem;color:var(--fg)}
  .pdb-row-c{font-size:.76rem;color:var(--muted)}
  .pdb-row-v{font-family:var(--jcpd-font-mono);font-size:.88rem;font-weight:600;color:var(--green);width:58px;text-align:right}
  .pdb-empty{padding:22px;text-align:center;font-size:.85rem;color:var(--muted)}

  /* ── Dash C ── */
  .pdc-today{background:var(--surface);border-radius:18px;padding:22px;text-align:center}
  .pdc-today-l{font-size:.74rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px}
  .pdc-today-big{font-family:var(--jcpd-font-mono);font-size:3.4rem;font-weight:700;color:var(--fg);line-height:1.05;margin:6px 0}
  .pdc-today-big span{font-size:1.4rem;color:var(--muted);margin-left:2px}
  .pdc-today-sub{font-size:.95rem;font-weight:600}
  .pdc-today-meta{font-size:.78rem;color:var(--muted2);margin-top:6px}
  .pdc-strip{display:flex;gap:6px;margin:12px 0}
  .pdc-cell{flex:1;background:var(--surface);border-radius:10px;padding:10px 2px;text-align:center}
  .pdc-cell.today{background:var(--jcpd-accent-dim);box-shadow:inset 0 0 0 1.5px var(--accent)}
  .pdc-cell-n{display:block;font-size:.68rem;color:var(--muted);margin-bottom:3px}
  .pdc-cell-v{display:block;font-family:var(--jcpd-font-mono);font-size:.82rem;font-weight:600;color:var(--fg)}
  .pdc-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .pdc-tile{background:var(--surface);border-radius:14px;padding:16px}
  .pdc-tile-l{display:block;font-size:.74rem;color:var(--muted)}
  .pdc-tile-v{display:block;font-family:var(--jcpd-font-mono);font-size:1.5rem;font-weight:700;color:var(--fg);margin:4px 0 2px}
  .pdc-tile-s{display:block;font-size:.72rem;color:var(--muted2)}
  `;
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();
