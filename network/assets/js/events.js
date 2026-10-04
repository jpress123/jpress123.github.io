/* Ecosystem Events: list, month calendar, map, filters and iCal export. */
(function () {
  'use strict';
  var S = window.SUES, K = window.SUES_CARDS, C = S.C, esc = S.esc, t = S.t, ZH = S.lang === 'zh';
  var q = S.qs();
  var state = { view: q.view || 'list', type: q.type || '', sector: q.sector || '', solution: q.solution || '', zone: q.zone || '', region: q.region || '', mode: q.mode || '', from: q.from || '', to: q.to || '', past: q.past || '' };
  var events, all, month = S.today(); month.setDate(1);

  function match(e) {
    if (state.type && e.type !== state.type) return false;
    if (state.sector && (e.sectors || []).indexOf(state.sector) < 0) return false;
    if (state.solution && (e.solutions || []).indexOf(state.solution) < 0) return false;
    if (state.zone && S.zoneKey(e) !== state.zone) return false;
    if (state.region && (e.place || {}).country !== state.region) return false;
    if (state.mode && e.mode !== state.mode) return false;
    if (state.from && (e.end_date || e.start_date) < state.from) return false;
    if (state.to && e.start_date > state.to) return false;
    return true;
  }
  function isPast(e) { return S.parseDate(e.end_date || e.start_date) < S.today(); }

  function renderFilters() {
    var countries = Array.from(new Set(events.map(function (e) { return (e.place || {}).country; }).filter(Boolean))).sort();
    document.getElementById('filters').innerHTML =
      '<div><label for="f-type">' + esc(t('type')) + '</label><select id="f-type" data-k="type">' + S.options(C.eventTypes, null, state.type) + '</select></div>' +
      '<div><label for="f-sector">' + esc(t('sector')) + '</label><select id="f-sector" data-k="sector">' + S.options(C.sectors, S.sectorLabel, state.sector) + '</select></div>' +
      '<div><label for="f-solution">' + esc(t('solution')) + '</label><select id="f-solution" data-k="solution">' + S.options(C.solutions, S.solutionLabel, state.solution) + '</select></div>' +
      '<div><label for="f-zone">' + esc(t('zone')) + '</label><select id="f-zone" data-k="zone">' + S.options(Object.keys(C.dsfZones), S.zoneLabel, state.zone) + '</select></div>' +
      '<div><label for="f-region">' + esc(t('region')) + '</label><select id="f-region" data-k="region">' + S.options(countries, null, state.region) + '</select></div>' +
      '<div><label for="f-mode">' + esc(t('mode')) + '</label><select id="f-mode" data-k="mode">' + S.options(['in person', 'online', 'hybrid'], null, state.mode) + '</select></div>' +
      '<div><label for="f-from">' + esc(t('from')) + '</label><input id="f-from" type="date" data-k="from" value="' + esc(state.from) + '"></div>' +
      '<div><label for="f-to">' + esc(t('to')) + '</label><input id="f-to" type="date" data-k="to" value="' + esc(state.to) + '"></div>';
    document.querySelectorAll('#filters [data-k]').forEach(function (el) { el.addEventListener('change', function () { state[el.getAttribute('data-k')] = el.value; update(); }); });
  }

  function update() {
    var qsState = {}; Object.keys(state).forEach(function (k) { qsState[k] = k === 'view' && state.view === 'list' ? '' : state[k]; });
    S.setQs(qsState);
    var list = events.filter(match);
    var upcoming = list.filter(function (e) { return !isPast(e); }).sort(function (a, b) { return a.start_date.localeCompare(b.start_date); });
    var past = list.filter(isPast).sort(function (a, b) { return b.start_date.localeCompare(a.start_date); });
    document.getElementById('count').innerHTML = '<span>' + upcoming.length + ' ' + (ZH ? '项即将举行' : 'upcoming') + ' &middot; ' + past.length + ' ' + (ZH ? '项已结束' : 'past') + '</span>' +
      '<button class="btn ghost small" type="button" id="ics-all">' + (ZH ? '下载当前筛选的日历订阅 (iCal)' : 'Download calendar feed for this filter (iCal)') + '</button>';
    document.getElementById('ics-all').addEventListener('click', function () { S.download('sues-network-events.ics', S.ics(upcoming, 'SUES Design Network events'), 'text/calendar'); });

    document.getElementById('list').innerHTML = (upcoming.length ? upcoming.map(function (e) { return K.eventCard(e, { inPage: true }); }).join('') : '<div class="empty">' + (ZH ? '暂无即将举行的活动。' : 'No upcoming events match.') + '</div>') +
      (past.length ? '<h3 style="grid-column:1/-1;margin-top:18px">' + (ZH ? '活动档案' : 'Archive') + '</h3>' + past.map(function (e) { return K.eventCard(e, { inPage: true }); }).join('') : '');
    renderCalendar(list);
    if (state.view === 'map') renderMap(list);
  }

  function renderMap(list) {
    S.map(document.getElementById('map'), list.filter(function (e) { return e.mode !== 'online'; }).map(function (e) {
      return { lat: (e.place || {}).lat, lng: (e.place || {}).lng, title: S.L(e, 'title'), place: S.placeText(e.place) + ', ' + S.fmtDate(e.start_date), href: '#' + encodeURIComponent(e.id), color: K.ZONE_COLOR[S.zoneKey(e)] };
    }));
  }

  function renderCalendar(list) {
    var y = month.getFullYear(), m = month.getMonth();
    var first = new Date(y, m, 1), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    var dows = ZH ? ['一', '二', '三', '四', '五', '六', '日'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var title = ZH ? y + '年' + (m + 1) + '月' : first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    var todayIso = S.isoDate(S.today());
    var html = '<div class="cal-head"><button class="btn ghost small" type="button" data-step="-1" aria-label="Previous month">←</button><h3>' + esc(title) + '</h3><button class="btn ghost small" type="button" data-step="1" aria-label="Next month">→</button></div><div class="cal">' +
      dows.map(function (d) { return '<div class="dow">' + d + '</div>'; }).join('');
    var cells = Math.ceil((((first.getDay() + 6) % 7) + new Date(y, m + 1, 0).getDate()) / 7) * 7;
    for (var i = 0; i < cells; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var iso = S.isoDate(d);
      var evs = list.filter(function (e) { return e.start_date <= iso && (e.end_date || e.start_date) >= iso; });
      html += '<div class="day' + (d.getMonth() !== m ? ' out' : '') + (iso === todayIso ? ' today' : '') + '"><div class="d">' + d.getDate() + '</div>' +
        evs.map(function (e) { return '<button class="ev" type="button" data-id="' + esc(e.id) + '" title="' + esc(S.L(e, 'title')) + '">' + esc(S.L(e, 'title')) + '</button>'; }).join('') + '</div>';
    }
    html += '</div>';
    var el = document.getElementById('calendar');
    el.innerHTML = html;
    el.querySelectorAll('[data-step]').forEach(function (b) { b.addEventListener('click', function () { month.setMonth(month.getMonth() + +b.getAttribute('data-step')); renderCalendar(list); }); });
    el.querySelectorAll('.ev').forEach(function (b) { b.addEventListener('click', function () { S.openRecord(b.getAttribute('data-id')); }); });
  }

  function switchView(v) {
    state.view = v;
    document.querySelectorAll('#views [data-view]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-view') === v); });
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== v; });
  }

  S.loadAll().then(function (a) {
    all = a; events = a.events.slice();
    S.exampleNotice(document.getElementById('notice'), events);
    renderFilters();
    document.querySelectorAll('#views [data-view]').forEach(function (b) { b.addEventListener('click', function () { switchView(b.getAttribute('data-view')); update(); }); });
    switchView(state.view);
    update();
    S.onHash(function (id) {
      var e = events.filter(function (x) { return x.id === id; })[0];
      if (!e) return;
      S.modal(K.eventDetail(e, all));
      var b = document.querySelector('[data-ics]');
      if (b) b.addEventListener('click', function () { S.download(e.id + '.ics', S.ics([e], S.L(e, 'title')), 'text/calendar'); });
    });
  });
})();
