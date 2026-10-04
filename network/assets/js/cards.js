/* Shared renderers: record cards, detail views, the DSF map and the heat map. */
(function () {
  'use strict';
  var S = window.SUES, C = S.C, esc = S.esc, t = S.t, L = S.L;
  var ZH = S.lang === 'zh';
  var ZONE_CLASS = { 'local-collective': 'lc', 'global-collective': 'gc', 'local-individual': 'li', 'global-individual': 'gi' };
  var ZONE_COLOR = { 'local-collective': '#2f7d6d', 'global-collective': '#3d5f9e', 'local-individual': '#a8762a', 'global-individual': '#8a4f7d' };

  function newest(list, key) { return list.slice().sort(function (a, b) { return (b[key || 'date'] || '').localeCompare(a[key || 'date'] || ''); }); }

  function signalCard(s, opts) {
    opts = opts || {};
    var link = opts.inPage ? '#' + encodeURIComponent(s.id) : S.href('signals', s.id);
    return '<article class="card">' +
      '<div class="meta">' + esc(S.fmtDate(s.date)) + ' ' + S.strengthBadge(s.signal_strength) + S.zoneBadge(s) + S.exampleBadge(s) + (s.retracted ? '<span class="badge example">Retracted</span>' : '') + '</div>' +
      '<h3><a href="' + link + '">' + esc(L(s, 'title')) + '</a></h3>' +
      (ZH ? '' : (s.title_zh ? '<div class="zh">' + esc(s.title_zh) + '</div>' : '')) +
      '<div class="meta">' + esc(S.sectorLabel(s.sector)) + ' &middot; ' + esc(S.solutionLabel(s.solution)) + ' &middot; ' + esc(S.placeText(s.place)) + '</div>' +
      (opts.full ? '<p>' + esc(s.body && s.body.signal) + '</p>' : '') +
      '<div class="meta">' + S.impactDots(s.impact_score) + '</div>' +
      '</article>';
  }

  function signalDetail(s, all) {
    var b = s.body || {};
    var rel = [].concat(s.related_signals || [], s.related_stories || [], s.related_opportunities || []);
    return '<div class="meta">' + esc(S.fmtDate(s.date)) + ' ' + S.strengthBadge(s.signal_strength) + S.zoneBadge(s) + S.exampleBadge(s) + ' ' + S.impactDots(s.impact_score) + '</div>' +
      '<h2>' + esc(L(s, 'title')) + '</h2>' +
      (ZH ? '<div class="zh">' + esc(s.title_en) + '</div>' : (s.title_zh ? '<div class="zh">' + esc(s.title_zh) + '</div>' : '')) +
      '<div class="meta">' + esc(S.sectorLabel(s.sector)) + ' &middot; ' + esc(S.solutionLabel(s.solution)) + ' &middot; ' + esc(S.placeText(s.place)) +
      ((s.practitioners || []).length ? ' &middot; ' + esc(s.practitioners.join(', ')) : '') + '</div>' +
      (s.correction ? '<div class="notice"><strong>Correction.</strong> ' + esc(s.correction) + '</div>' : '') +
      '<h4>' + (ZH ? '信号' : 'Signal') + '</h4><p>' + esc(b.signal) + '</p>' +
      '<h4>' + (ZH ? '为何可行' : 'Why it works') + '</h4><p>' + esc(b.why_it_works) + '</p>' +
      '<h4>' + (ZH ? '可迁移性' : 'Transferability') + '</h4><p>' + esc(b.transferability) + '</p>' +
      '<h4>' + (ZH ? '本周行动' : 'Next step this week') + '</h4><p>' + esc(b.next_step) + '</p>' +
      (b.related_notes ? '<p class="muted small">' + esc(b.related_notes) + '</p>' : '') +
      S.tagsHtml(s.tags) +
      '<h4>' + esc(t('source')) + '</h4><p><a href="' + esc(s.source_url) + '" target="_blank" rel="noopener">' + esc(s.source_name || s.source_url) + '</a></p>' +
      (s.contributed_by ? '<p class="small muted">' + esc(t('contributedBy')) + ': ' + esc(s.contributed_by) + '</p>' : '') +
      (rel.length ? '<h4>' + esc(t('related')) + '</h4>' + S.relatedLinks(all, rel) : '') +
      '<p class="small muted" style="margin-top:14px">' + esc(C.canonicalBase) + 'signals/#' + esc(s.id) + '</p>';
  }

  function storyCard(s, opts) {
    opts = opts || {};
    var link = opts.inPage ? '#' + encodeURIComponent(s.id) : S.href('stories', s.id);
    return '<article class="card">' +
      '<div class="meta"><span class="badge">' + esc(s.status) + '</span>' + S.zoneBadge(s) + S.exampleBadge(s) + '</div>' +
      '<h3><a href="' + link + '">' + esc(L(s, 'title')) + '</a></h3>' +
      '<p class="muted" style="margin:0">' + esc(L(s, 'summary')) + '</p>' +
      '<div class="meta">' + esc(S.placeText(s.place)) + ' &middot; ' + esc(S.sectorLabel(s.solution && s.solution.sector)) + '</div>' +
      '<a class="more" href="' + link + '">' + esc(t('readMore')) + '</a></article>';
  }

  function fmtNum(v) { return Number(v).toLocaleString(ZH ? 'zh-CN' : 'en-GB'); }

  function storyDetail(s, all) {
    var sol = s.solution || {};
    var rel = [].concat(s.related_signals || [], s.related_opportunities || [], s.related_experts || []);
    var statuses = C.storyStatuses, si = statuses.indexOf(s.status);
    return '<div class="meta"><span class="badge">' + esc(s.status) + '</span>' + S.zoneBadge(s) + S.exampleBadge(s) + ' ' + esc(S.fmtDate(s.date)) + '</div>' +
      '<h2>' + esc(L(s, 'title')) + '</h2>' +
      '<p class="muted">' + esc(L(s, 'summary')) + '</p>' +
      '<div class="meta">' + esc(S.placeText(s.place)) + ' &middot; ' + esc(S.sectorLabel(sol.sector)) + ' &middot; ' + esc(S.solutionLabel(sol.solution_type)) + '</div>' +
      '<div class="pipeline">' + statuses.slice(0, 4).map(function (x, i) { return '<span class="' + (x === s.status ? 'on' : (si > -1 && i < si ? 'done' : '')) + '">' + esc(x) + '</span>'; }).join('') +
      (si > 3 ? '<span class="on">' + esc(s.status) + '</span>' : '') + '</div>' +
      '<p class="small muted">' + (ZH ? '状态复核日期：' : 'Status reviewed ') + esc(S.fmtDate(s.status_reviewed)) + '</p>' +
      '<h4>' + (ZH ? '实践者' : 'Practitioners') + '</h4><ul class="link-list">' + (s.practitioners || []).map(function (p) {
        var name = p.expert_id ? '<a href="' + S.href('about', p.expert_id) + '">' + esc(p.name) + '</a>' : esc(p.name);
        return '<li>' + name + (p.organisation ? ', ' + esc(p.organisation) : '') + (p.role ? ' <span class="muted">(' + esc(p.role) + ')</span>' : '') + ' ' + S.consentBadge(p.consent) + '</li>';
      }).join('') + '</ul>' +
      '<h4>' + (ZH ? '挑战' : 'Challenge') + '</h4><p>' + esc(s.challenge) + '</p>' +
      '<h4>' + (ZH ? '方案' : 'Solution') + '</h4><p>' + esc(sol.text) + '</p>' +
      ((s.results || []).length ? '<h4>' + (ZH ? '成果' : 'Results') + '</h4><div class="results-box">' + s.results.map(function (r) {
        return '<div class="r"><div>' + esc(r.label) + '<div class="small muted">' + esc(r.period) + (r.baseline ? ' &middot; ' + (ZH ? '基线：' : 'baseline: ') + esc(r.baseline) : '') +
          ' &middot; ' + (r.verification === 'third-party' ? (ZH ? '第三方核实' : 'third-party verified') : (ZH ? '实践者自报' : 'as reported by the practitioner')) +
          (r.source ? ' &middot; ' + esc(r.source) : '') + '</div></div><div class="v">' + esc(fmtNum(r.value)) + ' ' + esc(r.unit) + '</div></div>';
      }).join('') + '</div>' : '') +
      '<h4>' + (ZH ? '经验与迁移' : 'Lessons and transfer') + '</h4><p>' + esc(s.lessons) + '</p>' +
      ((s.evidence || []).length ? '<h4>' + (ZH ? '证据' : 'Evidence') + '</h4><ul class="link-list">' + s.evidence.map(function (e) { return '<li>' + (e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.label || e.url) + '</a>' : esc(e.label)) + '</li>'; }).join('') + '</ul>' : '') +
      (s.image && s.image.url ? '<figure style="margin:14px 0"><img src="' + esc(s.image.url) + '" alt=""><figcaption class="small muted">' + esc(s.image.licence) + '</figcaption></figure>' : '') +
      (s.place && isFinite(s.place.lat) ? '<p class="small"><a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=' + s.place.lat + '&mlon=' + s.place.lng + '#map=8/' + s.place.lat + '/' + s.place.lng + '">' + (ZH ? '在地图上查看' : 'View on map') + '</a></p>' : '') +
      (rel.length ? '<h4>' + esc(t('related')) + '</h4>' + S.relatedLinks(all, rel) : '');
  }

  function oppCard(o, opts) {
    opts = opts || {};
    var link = opts.inPage ? '#' + encodeURIComponent(o.id) : S.href('opportunities', o.id);
    return '<article class="card">' +
      '<div class="meta"><span class="badge">' + esc(o.status) + '</span>' + S.zoneBadge(o) + S.exampleBadge(o) + '</div>' +
      '<h3><a href="' + link + '">' + esc(L(o, 'title')) + '</a></h3>' +
      '<div class="meta">' + esc(S.placeText(o.place)) + ' &middot; ' + esc(S.sectorLabel(o.sector)) + ' &middot; ' + esc(S.solutionLabel(o.solution_type)) + '</div>' +
      '<p class="muted small" style="margin:0">' + esc((o.matches || []).length) + ' ' + (ZH ? '个匹配方案' : ((o.matches || []).length === 1 ? 'matched solution' : 'matched solutions')) + '</p>' +
      '<a class="more" href="' + link + '">' + esc(t('readMore')) + '</a></article>';
  }

  function oppDetail(o, all) {
    var st = C.opportunityStatuses, i = st.indexOf(o.status);
    var ids = S.byId(all);
    return '<div class="meta">' + S.zoneBadge(o) + S.exampleBadge(o) + ' ' + esc(S.fmtDate(o.date)) + '</div>' +
      '<h2>' + esc(L(o, 'title')) + '</h2>' +
      '<div class="pipeline">' + st.map(function (x, k) { return '<span class="' + (k === i ? 'on' : (k < i ? 'done' : '')) + '">' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<h4>' + (ZH ? '需求' : 'Need') + '</h4><p>' + esc(o.description) + '</p>' +
      '<div class="results-box">' +
      [[ZH ? '地点' : 'Place', S.placeText(o.place)], [ZH ? '领域' : 'Sector', S.sectorLabel(o.sector)], [ZH ? '方案类型' : 'Solution type', S.solutionLabel(o.solution_type)],
       [ZH ? '规模' : 'Scale', o.scale], [ZH ? '时间' : 'Timeline', o.timeline], [ZH ? '预算区间' : 'Budget band', o.budget_band]]
        .map(function (r) { return '<div class="r"><span>' + esc(r[0]) + '</span><span class="v">' + esc(r[1] || '') + '</span></div>'; }).join('') + '</div>' +
      '<h4>' + (ZH ? '匹配方案' : 'Matched solutions') + '</h4>' +
      ((o.matches || []).length ? o.matches.map(function (m) {
        var ex = m.expert_id && ids[m.expert_id];
        return '<div class="panel" style="margin:8px 0"><strong>' + esc(m.practice) + '</strong> <span class="muted small">' + esc(m.origin) + ' &middot; ' + esc(m.solution_status) + '</span>' +
          '<p style="margin:8px 0">' + esc(m.rationale) + '</p>' +
          '<p class="small muted" style="margin:0 0 6px">' + (ZH ? '迁移条件：' : 'Conditions for transfer: ') + esc(m.conditions) + '</p>' +
          '<ul class="link-list">' +
          (m.signal_id ? '<li><a href="' + S.href('signals', m.signal_id) + '">' + (ZH ? '相关信号' : 'Signal') + '</a></li>' : '') +
          (m.story_id ? '<li><a href="' + S.href('stories', m.story_id) + '">' + (ZH ? '影响力案例' : 'Story of Impact') + '</a></li>' : '') +
          (ex ? '<li>' + (ZH ? '可提供帮助的专家：' : 'Expert who can help: ') + '<a href="' + S.href('about', m.expert_id) + '">' + esc(ex.rec.name) + '</a></li>' : '') +
          '</ul></div>';
      }).join('') : '<p class="muted">' + (ZH ? '编辑正在审核候选方案。' : 'The editor is reviewing candidate solutions.') + '</p>') +
      (o.outcome ? '<h4>' + (ZH ? '结果' : 'Outcome') + '</h4><p>' + esc(o.outcome) + '</p>' : '') +
      '<h4>' + (ZH ? '联系' : 'Contact') + '</h4><p>' + (ZH ? '个人联系方式不在公开页面显示。请通过表单请求引荐。' : 'Personal contact details stay off the public page. Request an introduction through the form.') +
      ' <a href="' + S.root + 'members/?form=intro&ref=' + encodeURIComponent(o.id) + '">' + (ZH ? '请求引荐' : 'Request an introduction') + '</a></p>';
  }

  function eventCard(e, opts) {
    opts = opts || {};
    var link = opts.inPage ? '#' + encodeURIComponent(e.id) : S.href('events', e.id);
    var dates = S.fmtDate(e.start_date) + (e.end_date && e.end_date !== e.start_date ? ' to ' + S.fmtDate(e.end_date) : '');
    return '<article class="card">' +
      '<div class="meta"><span class="badge' + (e.type === 'network event' ? ' network' : '') + '">' + esc(e.type) + '</span><span class="badge">' + esc(e.mode) + '</span>' + S.exampleBadge(e) +
      (e.status === 'cancelled' ? '<span class="badge example">cancelled</span>' : '') + '</div>' +
      '<h3><a href="' + link + '">' + esc(L(e, 'title')) + '</a></h3>' +
      '<div class="meta">' + esc(dates) + (e.date_confirmed === false ? ' &middot; ' + (ZH ? '日期待确认' : 'date to be confirmed') : '') + '</div>' +
      '<div class="meta">' + esc(e.mode === 'online' ? (ZH ? '线上' : 'Online') : S.placeText(e.place)) + ' &middot; ' + esc(e.organiser) + '</div>' +
      '</article>';
  }

  function eventDetail(e, all) {
    var rel = [].concat(e.related_signals || [], e.related_stories || [], e.speakers || []);
    var dates = S.fmtDate(e.start_date) + (e.end_date && e.end_date !== e.start_date ? ' to ' + S.fmtDate(e.end_date) : '');
    return '<div class="meta"><span class="badge' + (e.type === 'network event' ? ' network' : '') + '">' + esc(e.type) + '</span><span class="badge">' + esc(e.status) + '</span>' + S.zoneBadge(e) + S.exampleBadge(e) + '</div>' +
      '<h2>' + esc(L(e, 'title')) + '</h2>' +
      '<div class="results-box">' +
      [[ZH ? '日期' : 'Dates', dates + (e.date_confirmed === false ? (ZH ? '（待确认）' : ' (to be confirmed)') : '')], [ZH ? '形式' : 'Mode', e.mode],
       [ZH ? '地点' : 'Place', e.mode === 'online' ? 'Online' : S.placeText(e.place)], [ZH ? '主办方' : 'Organiser', e.organiser],
       [ZH ? '受众' : 'Audience', e.audience], [ZH ? '费用' : 'Cost', e.cost],
       [ZH ? '领域' : 'Sectors', (e.sectors || []).map(S.sectorLabel).join(', ')], [ZH ? '方案类型' : 'Solutions', (e.solutions || []).map(S.solutionLabel).join(', ')]]
        .map(function (r) { return '<div class="r"><span>' + esc(r[0]) + '</span><span class="v">' + esc(r[1] || '') + '</span></div>'; }).join('') + '</div>' +
      '<p style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">' +
      (e.registration_url ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(e.registration_url) + '">' + (e.type === 'network event' ? (ZH ? '报名' : 'Register') : (ZH ? '主办方页面' : 'Organiser page')) + '</a>' : '') +
      '<button class="btn ghost" type="button" data-ics="' + esc(e.id) + '">' + (ZH ? '加入日历' : 'Add to calendar') + '</button></p>' +
      (e.outcome_notes ? '<h4>' + (ZH ? '成果' : 'Outcome') + '</h4><p>' + esc(e.outcome_notes) + '</p>' : '') +
      (rel.length ? '<h4>' + esc(t('related')) + '</h4>' + S.relatedLinks(all, rel) : '') +
      (e.source_url ? '<p class="small muted">' + esc(t('source')) + ': <a href="' + esc(e.source_url) + '" target="_blank" rel="noopener">' + esc(e.source_url) + '</a></p>' : '');
  }

  /* DSF map with counts. onPick(zoneKey) or links to the signals feed. */
  function dsfMap(el, counts, opts) {
    opts = opts || {};
    function zone(k) {
      var z = C.dsfZones[k];
      var inner = '<span class="zname">' + esc(S.zoneLabel(k)) + '</span><span class="zcount">' + (counts[k] || 0) + '</span>' +
        '<span class="zsub">' + esc(t(z.x)) + ' ' + esc(t('production').toLowerCase()) + ' &middot; ' + esc(t(z.y)) + ' ' + esc(t('consumption').toLowerCase()) + '</span>';
      return opts.onPick ? '<button type="button" class="zone ' + ZONE_CLASS[k] + '" data-zone="' + k + '">' + inner + '</button>'
        : '<a class="zone ' + ZONE_CLASS[k] + '" href="' + S.root + 'signals/?zone=' + k + '">' + inner + '</a>';
    }
    el.innerHTML = '<div class="yaxis"><span>' + esc(t('individual')) + '</span><span>' + esc(t('consumption')) + '</span><span>' + esc(t('collective')) + '</span></div>' +
      zone('local-collective') + zone('global-collective') + zone('local-individual') + zone('global-individual') +
      '<div class="xaxis"><span>' + esc(t('local')) + '</span><span>' + esc(t('production')) + '</span><span>' + esc(t('global')) + '</span></div>';
    if (opts.onPick) el.querySelectorAll('[data-zone]').forEach(function (b) { b.addEventListener('click', function () { opts.onPick(b.getAttribute('data-zone')); }); });
  }

  function zoneCounts(signals, days) {
    var c = {};
    signals.forEach(function (s) { if (days && S.daysAgo(s.date) > days) return; var k = S.zoneKey(s); if (k) c[k] = (c[k] || 0) + 1; });
    return c;
  }

  /* Heat map: sectors as columns, solutions as rows, colour by mean impact. */
  function heatCells(signals) {
    var cells = {};
    C.solutions.forEach(function (sol) { C.sectors.forEach(function (sec) { cells[sec + '|' + sol] = { n: 0, sum: 0 }; }); });
    signals.forEach(function (s) { var c = cells[s.sector + '|' + s.solution]; if (c) { c.n++; c.sum += +s.impact_score || 0; } });
    return cells;
  }
  function heatMap(el, cells, onPick) {
    var html = '<table class="heat"><caption class="sr-only">Sector by solution heat map</caption><thead><tr><th class="row"></th>' +
      C.sectors.map(function (s) { return '<th scope="col">' + esc(S.sectorLabel(s)) + '</th>'; }).join('') + '</tr></thead><tbody>';
    C.solutions.forEach(function (sol) {
      html += '<tr><th scope="row" class="row">' + esc(S.solutionLabel(sol)) + '</th>';
      C.sectors.forEach(function (sec) {
        var c = cells[sec + '|' + sol] || { n: 0, sum: 0 };
        var avg = c.n ? c.sum / c.n : 0;
        var h = c.n ? Math.max(1, Math.round(avg)) : 0;
        html += '<td><button type="button" class="h' + h + '" data-sector="' + esc(sec) + '" data-solution="' + esc(sol) + '" aria-label="' + esc(sec + ', ' + sol + ': ' + c.n + ' signals, mean impact ' + avg.toFixed(1)) + '">' +
          '<span class="n">' + c.n + '</span><span class="s">' + (c.n ? (ZH ? '影响力 ' : 'impact ') + avg.toFixed(1) : (ZH ? '暂无覆盖' : 'no coverage')) + '</span></button></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table><div class="legend"><span>' + (ZH ? '平均影响力' : 'Mean impact score') + '</span>' +
      [0, 1, 2, 3, 4, 5].map(function (i) { return '<span><span class="sw h' + i + '"></span>' + (i ? i : (ZH ? '无' : 'none')) + '</span>'; }).join('') + '</div>';
    el.innerHTML = html;
    if (onPick) el.querySelectorAll('button[data-sector]').forEach(function (b) { b.addEventListener('click', function () { onPick(b.getAttribute('data-sector'), b.getAttribute('data-solution')); }); });
  }

  function zoneNote(el) { if (el && C.dsfZonesArePlaceholders) el.textContent = t('placeholderZones'); }

  window.SUES_CARDS = {
    newest: newest, signalCard: signalCard, signalDetail: signalDetail, storyCard: storyCard, storyDetail: storyDetail,
    oppCard: oppCard, oppDetail: oppDetail, eventCard: eventCard, eventDetail: eventDetail,
    dsfMap: dsfMap, zoneCounts: zoneCounts, heatCells: heatCells, heatMap: heatMap, zoneNote: zoneNote,
    ZONE_CLASS: ZONE_CLASS, ZONE_COLOR: ZONE_COLOR, fmtNum: fmtNum
  };
})();
