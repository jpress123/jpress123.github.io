/* Sustainability Signals: feed, heat map, DSF cloud, trajectory and table views. */
(function () {
  'use strict';
  var S = window.SUES, K = window.SUES_CARDS, C = S.C, esc = S.esc, t = S.t, ZH = S.lang === 'zh';
  var q = S.qs();
  var state = { view: q.view || 'feed', sector: q.sector || '', solution: q.solution || '', zone: q.zone || '', strength: q.strength || '', region: q.region || '', tag: q.tag || '', kw: q.q || '' };
  var all, signals;
  var STRENGTH_ORDER = { weak: 1, emerging: 2, strong: 3 };

  function match(s, skip) {
    skip = skip || {};
    if (!skip.sector && state.sector && s.sector !== state.sector) return false;
    if (!skip.solution && state.solution && s.solution !== state.solution) return false;
    if (!skip.zone && state.zone && S.zoneKey(s) !== state.zone && s.dsf_secondary_zone !== state.zone) return false;
    if (state.strength && s.signal_strength !== state.strength) return false;
    if (state.region && (s.place || {}).country !== state.region) return false;
    if (!skip.tag && state.tag && (s.tags || []).indexOf(state.tag) < 0) return false;
    if (state.kw) {
      var hay = [s.title_en, s.title_zh, (s.tags || []).join(' '), JSON.stringify(s.body || {}), S.placeText(s.place), (s.practitioners || []).join(' ')].join(' ').toLowerCase();
      if (hay.indexOf(state.kw.toLowerCase()) < 0) return false;
    }
    return true;
  }

  function renderFilters() {
    var countries = Array.from(new Set(signals.map(function (s) { return (s.place || {}).country; }).filter(Boolean))).sort();
    var zones = Object.keys(C.dsfZones);
    document.getElementById('filters').innerHTML =
      '<div><label for="f-sector">' + esc(t('sector')) + '</label><select id="f-sector" data-k="sector">' + S.options(C.sectors, S.sectorLabel, state.sector) + '</select></div>' +
      '<div><label for="f-solution">' + esc(t('solution')) + '</label><select id="f-solution" data-k="solution">' + S.options(C.solutions, S.solutionLabel, state.solution) + '</select></div>' +
      '<div><label for="f-zone">' + esc(t('zone')) + '</label><select id="f-zone" data-k="zone">' + S.options(zones, S.zoneLabel, state.zone) + '</select></div>' +
      '<div><label for="f-strength">' + esc(t('strength')) + '</label><select id="f-strength" data-k="strength">' + S.options(Object.keys(C.strengths), S.strengthLabel, state.strength) + '</select></div>' +
      '<div><label for="f-region">' + esc(t('region')) + '</label><select id="f-region" data-k="region">' + S.options(countries, null, state.region) + '</select></div>' +
      '<div><label for="f-kw">' + esc(t('keyword')) + '</label><input id="f-kw" type="search" data-k="kw" value="' + esc(state.kw) + '"></div>';
    document.querySelectorAll('#filters [data-k]').forEach(function (el) {
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', function () { state[el.getAttribute('data-k')] = el.value; update(); });
    });
  }

  function syncFilters() {
    document.querySelectorAll('#filters [data-k]').forEach(function (el) { el.value = state[el.getAttribute('data-k')] || ''; });
  }

  function update() {
    S.setQs({ view: state.view === 'feed' ? '' : state.view, sector: state.sector, solution: state.solution, zone: state.zone, strength: state.strength, region: state.region, tag: state.tag, q: state.kw });
    var list = signals.filter(function (s) { return match(s); });
    var active = ['sector', 'solution', 'zone', 'strength', 'region', 'tag', 'kw'].some(function (k) { return state[k]; });
    document.getElementById('count').innerHTML = '<span>' + list.length + ' ' + esc(t('records')) + '</span>' +
      (state.tag ? '<span class="tag">#' + esc(state.tag) + '</span>' : '') +
      (active ? '<button class="btn ghost small" type="button" id="clear">' + esc(t('clear')) + '</button>' : '');
    var clr = document.getElementById('clear');
    if (clr) clr.addEventListener('click', function () { Object.keys(state).forEach(function (k) { if (k !== 'view') state[k] = ''; }); syncFilters(); update(); });

    document.getElementById('feed').innerHTML = list.length ? list.map(function (s) { return K.signalCard(s, { inPage: true }); }).join('') : '<div class="empty">' + esc(t('noResults')) + '</div>';

    K.heatMap(document.getElementById('heat'), K.heatCells(signals.filter(function (s) { return match(s, { sector: 1, solution: 1 }); })), function (sec, sol) {
      state.sector = sec; state.solution = sol; switchView('feed'); syncFilters(); update();
    });
    renderCloud();
    renderTrajectory(list);
    renderTable(list);
  }

  function renderCloud() {
    var pool = signals.filter(function (s) { return S.daysAgo(s.date) <= 90 && match(s, { zone: 1, tag: 1 }); });
    var order = ['local-collective', 'global-collective', 'local-individual', 'global-individual'];
    document.getElementById('cloud').innerHTML = order.map(function (z) {
      var tags = {};
      pool.forEach(function (s) {
        if (S.zoneKey(s) !== z) return;
        (s.tags || []).forEach(function (tag) {
          var x = tags[tag] || (tags[tag] = { n: 0, date: '', strength: '' });
          x.n++;
          if (s.date >= x.date) { x.date = s.date; x.strength = s.signal_strength; }
        });
      });
      var keys = Object.keys(tags).sort(function (a, b) { return tags[b].n - tags[a].n || a.localeCompare(b); });
      var max = keys.length ? tags[keys[0]].n : 1;
      return '<div class="q ' + K.ZONE_CLASS[z] + '"><h4>' + esc(S.zoneLabel(z)) + '</h4><div class="words">' +
        (keys.length ? keys.map(function (k) {
          var size = 0.85 + 0.9 * (tags[k].n / max);
          return '<button type="button" class="word s-' + tags[k].strength + '" style="font-size:' + size.toFixed(2) + 'rem" data-tag="' + esc(k) + '" data-zone="' + z + '" title="' + tags[k].n + ' ' + esc(S.strengthLabel(tags[k].strength)) + '">' + esc(k) + '</button>';
        }).join('') : '<span class="muted small">' + (ZH ? '最近 90 天暂无信号' : 'No signals in the last 90 days') + '</span>') + '</div></div>';
    }).join('');
    document.querySelectorAll('#cloud [data-tag]').forEach(function (b) {
      b.addEventListener('click', function () { state.tag = b.getAttribute('data-tag'); state.zone = b.getAttribute('data-zone'); switchView('feed'); syncFilters(); update(); });
    });
  }

  function renderTrajectory(list) {
    var ids = {}; signals.forEach(function (s) { ids[s.id] = s; });
    var adj = {};
    signals.forEach(function (s) {
      (s.related_signals || []).forEach(function (r) {
        if (!ids[r]) return;
        (adj[s.id] = adj[s.id] || []).push(r); (adj[r] = adj[r] || []).push(s.id);
      });
    });
    var seen = {}, chains = [];
    Object.keys(adj).forEach(function (id) {
      if (seen[id]) return;
      var stack = [id], comp = [];
      while (stack.length) { var x = stack.pop(); if (seen[x]) continue; seen[x] = 1; comp.push(ids[x]); (adj[x] || []).forEach(function (y) { if (!seen[y]) stack.push(y); }); }
      comp.sort(function (a, b) { return a.date.localeCompare(b.date); });
      chains.push(comp);
    });
    var visible = {}; list.forEach(function (s) { visible[s.id] = 1; });
    chains = chains.filter(function (c) { return c.some(function (s) { return visible[s.id]; }); });
    chains.sort(function (a, b) { return b[b.length - 1].date.localeCompare(a[a.length - 1].date); });
    document.getElementById('trajectory').innerHTML = chains.length ? chains.map(function (c) {
      var first = STRENGTH_ORDER[c[0].signal_strength], last = STRENGTH_ORDER[c[c.length - 1].signal_strength];
      var move = last > first ? (ZH ? '上升' : 'Moved up') : last < first ? (ZH ? '下降' : 'Moved down') : (ZH ? '持平' : 'Unchanged');
      return '<div class="chain"><span class="badge">' + esc(move) + '</span>' + c.map(function (s, i) {
        return (i ? '<span class="arrow" aria-hidden="true">→</span>' : '') +
          '<a class="step" href="#' + encodeURIComponent(s.id) + '"><span class="muted small">' + esc(S.fmtDate(s.date)) + '</span>' + S.strengthBadge(s.signal_strength) + '<span style="color:var(--ink)">' + esc(S.L(s, 'title')) + '</span></a>';
      }).join('') + '</div>';
    }).join('') : '<div class="empty">' + (ZH ? '暂无关联信号链。' : 'No linked signal chains yet.') + '</div>';
  }

  var sortKey = 'date', sortDir = -1;
  function renderTable(list) {
    var cols = [
      ['date', ZH ? '日期' : 'Date', function (s) { return s.date; }],
      ['title', ZH ? '标题' : 'Title', function (s) { return S.L(s, 'title'); }],
      ['sector', t('sector'), function (s) { return S.sectorLabel(s.sector); }],
      ['solution', t('solution'), function (s) { return S.solutionLabel(s.solution); }],
      ['zone', t('zone'), function (s) { return S.zoneLabel(S.zoneKey(s)); }],
      ['strength', t('strength'), function (s) { return STRENGTH_ORDER[s.signal_strength] || 0; }, function (s) { return S.strengthLabel(s.signal_strength); }],
      ['impact', t('impact'), function (s) { return +s.impact_score || 0; }],
      ['place', t('place'), function (s) { return S.placeText(s.place); }]
    ];
    var col = cols.filter(function (c) { return c[0] === sortKey; })[0];
    var rows = list.slice().sort(function (a, b) { var x = col[2](a), y = col[2](b); return (x > y ? 1 : x < y ? -1 : 0) * sortDir; });
    var tbl = document.getElementById('table');
    tbl.innerHTML = '<caption class="sr-only">Signals table</caption><thead><tr>' + cols.map(function (c) {
      return '<th scope="col"' + (c[0] === 'impact' ? ' class="num"' : '') + ' data-sort="' + c[0] + '" aria-sort="' + (c[0] === sortKey ? (sortDir > 0 ? 'ascending' : 'descending') : 'none') + '">' + esc(c[1]) + (c[0] === sortKey ? (sortDir > 0 ? ' ▲' : ' ▼') : '') + '</th>';
    }).join('') + '</tr></thead><tbody>' + rows.map(function (s) {
      return '<tr>' + cols.map(function (c) {
        var v = c[3] ? c[3](s) : c[2](s);
        if (c[0] === 'title') v = '<a href="#' + encodeURIComponent(s.id) + '">' + esc(v) + '</a>'; else v = esc(v);
        return '<td' + (c[0] === 'impact' ? ' class="num"' : '') + '>' + v + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    tbl.querySelectorAll('th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () { var k = th.getAttribute('data-sort'); if (k === sortKey) sortDir *= -1; else { sortKey = k; sortDir = k === 'title' || k === 'place' ? 1 : -1; } renderTable(list); });
    });
  }

  function switchView(v) {
    state.view = v;
    document.querySelectorAll('#views [data-view]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-view') === v); });
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== v; });
  }

  S.loadAll().then(function (a) {
    all = a;
    signals = K.newest(a.signals.filter(function (s) { return s.content_type !== 'monthly_synthesis' && s.content_type !== 'quarterly_report'; }));
    S.exampleNotice(document.getElementById('notice'), signals);
    K.zoneNote(document.getElementById('zone-note'));
    renderFilters();
    document.querySelectorAll('#views [data-view]').forEach(function (b) {
      b.addEventListener('click', function () { switchView(b.getAttribute('data-view')); update(); });
    });
    switchView(state.view);
    update();
    S.onHash(function (id) {
      var s = a.signals.filter(function (x) { return x.id === id; })[0];
      if (s) S.modal(K.signalDetail(s, all));
    });
  });
})();
