/* Impact Dashboard: draws every view from data/dashboard-data.json. */
(function () {
  'use strict';
  var S = window.SUES, K = window.SUES_CARDS, C = S.C, esc = S.esc, ZH = S.lang === 'zh';

  function bars(el, obj, labelFn) {
    var keys = Object.keys(obj || {});
    var max = Math.max.apply(null, keys.map(function (k) { return obj[k]; }).concat([1]));
    el.innerHTML = keys.length ? keys.map(function (k) {
      return '<div class="b"><span>' + esc(labelFn ? labelFn(k) : k) + '</span><span class="track"><span class="fill" style="width:' + (100 * obj[k] / max).toFixed(1) + '%"></span></span><span class="n">' + obj[k] + '</span></div>';
    }).join('') : '<div class="empty">0</div>';
  }

  S.load('dashboard-data').then(function (d) {
    if (!d || !d.totals) { document.getElementById('kpis').innerHTML = '<div class="empty">' + (ZH ? '仪表板数据尚未生成。' : 'Dashboard data has not been built yet.') + '</div>'; return; }
    if (d.example_records) document.getElementById('notice').innerHTML = '<div class="notice"><strong>' + esc(S.t('example')) + '.</strong> ' + esc(S.t('exampleNotice')) + '</div>';
    else if (d.draft_records) document.getElementById('notice').innerHTML = '<div class="notice"><strong>' + esc(S.t('draft')) + '.</strong> ' + esc(S.t('draftNotice')) + '</div>';
    document.getElementById('asof').textContent = (ZH ? '数据截至 ' : 'As of ') + S.fmtDate(d.as_of) + (ZH ? '，每次发布时重新生成。' : '. Rebuilt on every publish.');

    var T = d.totals, G = d.targets;
    var kp = [
      ['verified_signals', ZH ? '已发布的核实信号' : 'Verified signals published', 'signals'],
      ['stories', ZH ? '影响力案例' : 'Stories of Impact'],
      ['experts', ZH ? '名录中的专家' : 'Experts in the directory'],
      ['matched', ZH ? '已匹配方案的机会' : 'Opportunities matched to a solution'],
      ['subscribers', ZH ? '每周简报订阅者' : 'Weekly digest subscribers']
    ];
    document.getElementById('kpis').innerHTML = kp.map(function (k) {
      var v = T[k[0]], g = G[k[2] || k[0]];
      var extra = k[0] === 'verified_signals' && T.signals > v ? '<div class="l">' + (T.signals - v) + (ZH ? ' 条草稿待核实' : ' drafts awaiting verification') + '</div>' : '';
      var known = v !== null && v !== undefined;
      return '<div class="kpi"><div class="v">' + (known ? K.fmtNum(v) : '&ndash;') + '</div><div class="l">' + esc(k[1]) + '</div>' +
        '<div class="bar"><span style="width:' + (known ? Math.min(100, 100 * v / g).toFixed(1) : 0) + '%"></span></div>' +
        '<div class="l">' + (ZH ? '目标 ' : 'Target ') + K.fmtNum(g) + (known ? '' : (ZH ? '（来自邮件平台）' : ' (from the email platform)')) + '</div>' + extra + '</div>';
    }).join('');

    var cells = {};
    Object.keys(d.heat).forEach(function (k) { var c = d.heat[k]; cells[k] = { n: c.n, sum: c.mean_impact * c.n }; });
    K.heatMap(document.getElementById('heat'), cells, function (sec, sol) { location.href = S.root + 'signals/?sector=' + encodeURIComponent(sec) + '&solution=' + encodeURIComponent(sol); });

    var dsfEl = document.getElementById('dsf');
    function drawDsf(range) { K.dsfMap(dsfEl, range === 'all' ? d.dsf.all_time : d.dsf.last_90); }
    drawDsf('90');
    K.zoneNote(document.getElementById('zone-note'));
    document.querySelectorAll('#dsf-tabs [data-range]').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#dsf-tabs [data-range]').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        drawDsf(b.getAttribute('data-range'));
      });
    });

    var m = d.strength_movement;
    document.getElementById('movement').innerHTML =
      '<div class="kpis" style="grid-template-columns:repeat(3,1fr)">' +
      [['up', ZH ? '上升' : 'Moved up'], ['unchanged', ZH ? '持平' : 'Unchanged'], ['down', ZH ? '下降' : 'Moved down']].map(function (x) {
        return '<div class="kpi"><div class="v">' + m[x[0]] + '</div><div class="l">' + esc(x[1]) + '</div></div>';
      }).join('') + '</div>' +
      '<ul class="link-list" style="margin-top:12px">' + m.chains.map(function (c) {
        return '<li><a href="' + S.href('signals', c.ids[c.ids.length - 1]) + '">' + esc(ZH && c.title_zh ? c.title_zh : c.title_en) + '</a> <span class="muted small">' + esc(S.strengthLabel(c.from)) + ' → ' + esc(S.strengthLabel(c.to)) + '</span></li>';
      }).join('') + '</ul>';

    bars(document.getElementById('status'), d.story_status);

    document.getElementById('results').innerHTML = d.results.length ? d.results.map(function (u) {
      return '<div class="results-box" style="margin-bottom:10px"><div class="r"><strong>' + esc(u.unit) + '</strong><span class="v">' + K.fmtNum(Math.round(u.total * 100) / 100) + '</span></div>' +
        '<div class="small muted" style="padding:4px 0">' + (ZH ? '实践者自报 ' : 'As reported by the practitioner: ') + K.fmtNum(u.reported) + ' &middot; ' + (ZH ? '第三方核实 ' : 'third-party verified: ') + K.fmtNum(u.third_party) + '</div>' +
        u.items.map(function (i) {
          return '<div class="r small"><a href="' + S.href('stories', i.story_id) + '">' + esc(ZH && i.title_zh ? i.title_zh : i.title_en) + '</a><span>' + K.fmtNum(i.value) + ' <span class="muted">' + esc(i.period) + '</span></span></div>';
        }).join('') + '</div>';
    }).join('') + '<p class="small muted">' + (ZH ? '不同单位的数字不相加。' : 'Figures with different units are never added together.') + '</p>' : '<div class="empty">0</div>';

    bars(document.getElementById('funnel'), d.funnel);
    bars(document.getElementById('exp-country'), d.experts_by_country);
    bars(document.getElementById('exp-disc'), d.experts_by_discipline);

    var ev = d.events, evEl = document.getElementById('events');
    evEl.innerHTML = '<p class="small muted">' + (ZH ? '产生了影响力案例的活动：' : 'Events that produced a story: ') + '<strong>' + ev.produced_story + '</strong></p>' +
      '<h4 class="small muted">' + (ZH ? '按类型' : 'By type') + '</h4><div class="bars" id="ev-type"></div>' +
      '<h4 class="small muted" style="margin-top:12px">' + (ZH ? '按地区' : 'By region') + '</h4><div class="bars" id="ev-region"></div>' +
      '<h4 class="small muted" style="margin-top:12px">' + (ZH ? '按月份' : 'By month') + '</h4><div class="bars" id="ev-month"></div>';
    bars(document.getElementById('ev-type'), ev.by_type);
    bars(document.getElementById('ev-region'), ev.by_region);
    bars(document.getElementById('ev-month'), ev.by_month);

    S.map(document.getElementById('map'), d.story_points.map(function (p) {
      return { lat: p.lat, lng: p.lng, title: ZH && p.title_zh ? p.title_zh : p.title_en, place: p.place, href: S.href('stories', p.id), color: K.ZONE_COLOR[p.zone] };
    }));
  });
})();
