/* Who we are: DSF map and the expert directory. */
(function () {
  'use strict';
  var S = window.SUES, K = window.SUES_CARDS, C = S.C, esc = S.esc, t = S.t, ZH = S.lang === 'zh';
  var state = { discipline: '', country: '', sector: '' };
  S.loadAll().then(function (all) {
    K.dsfMap(document.getElementById('dsf'), K.zoneCounts(all.signals));
    K.zoneNote(document.getElementById('zone-note'));
    var experts = all.experts.filter(function (e) { return e.consent !== false; });
    S.exampleNotice(document.getElementById('notice'), experts);
    var disciplines = Array.from(new Set([].concat.apply([], experts.map(function (e) { return e.disciplines || []; })))).sort();
    var countries = Array.from(new Set(experts.map(function (e) { return e.country; }).filter(Boolean))).sort();
    document.getElementById('filters').innerHTML =
      '<div><label for="f-disc">' + (ZH ? '学科' : 'Discipline') + '</label><select id="f-disc" data-k="discipline">' + S.options(disciplines, null, '') + '</select></div>' +
      '<div><label for="f-country">' + (ZH ? '国家' : 'Country') + '</label><select id="f-country" data-k="country">' + S.options(countries, null, '') + '</select></div>' +
      '<div><label for="f-sector">' + esc(t('sector')) + '</label><select id="f-sector" data-k="sector">' + S.options(C.sectors, S.sectorLabel, '') + '</select></div>';
    document.querySelectorAll('#filters [data-k]').forEach(function (el) { el.addEventListener('change', function () { state[el.getAttribute('data-k')] = el.value; update(); }); });

    function initials(n) { return String(n || '').split(/\s+/).filter(Boolean).slice(-2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
    function card(e) {
      return '<article class="card expert" id="' + esc(e.id) + '"><div class="avatar" aria-hidden="true">' + esc(initials(e.name)) + '</div><div style="min-width:0">' +
        '<div class="meta">' + S.exampleBadge(e) + S.consentBadge(e.consent) + '</div>' +
        '<h3><a href="#' + encodeURIComponent(e.id) + '">' + esc(ZH && e.name_zh ? e.name_zh : e.name) + '</a></h3>' +
        '<div class="meta">' + esc(e.role) + ', ' + esc(e.organisation) + '</div><div class="meta">' + esc([e.city, e.country].filter(Boolean).join(', ')) + '</div>' +
        S.tagsHtml(e.disciplines) + '</div></article>';
    }
    function detail(e) {
      var stories = all.stories.filter(function (s) { return (s.related_experts || []).indexOf(e.id) > -1 || (s.practitioners || []).some(function (p) { return p.expert_id === e.id; }); });
      var opps = all.opportunities.filter(function (o) { return (o.matches || []).some(function (m) { return m.expert_id === e.id; }); });
      var evs = all.events.filter(function (v) { return (v.speakers || []).indexOf(e.id) > -1; });
      var rel = [].concat(stories.map(function (x) { return x.id; }), opps.map(function (x) { return x.id; }), evs.map(function (x) { return x.id; }));
      return '<div class="meta">' + S.exampleBadge(e) + S.consentBadge(e.consent) + '</div><h2>' + esc(ZH && e.name_zh ? e.name_zh : e.name) + '</h2>' +
        '<div class="meta">' + esc(e.role) + ', ' + esc(e.organisation) + ' &middot; ' + esc([e.city, e.country].filter(Boolean).join(', ')) + '</div>' +
        '<p>' + esc(S.L(e, 'bio')) + '</p>' + S.tagsHtml([].concat(e.disciplines || [], (e.sectors || []).map(S.sectorLabel))) +
        (e.link ? '<p style="margin-top:12px"><a href="' + esc(e.link) + '" target="_blank" rel="noopener">' + (ZH ? '个人主页' : 'Profile page') + '</a></p>' : '') +
        (rel.length ? '<h4>' + esc(t('related')) + '</h4>' + S.relatedLinks(all, rel) : '') +
        '<p class="small muted" style="margin-top:14px">' + (ZH ? '如需联系，请通过会员区请求引荐。' : 'To get in touch, request an introduction through the member area.') + ' <a href="' + S.root + 'members/?form=intro&ref=' + encodeURIComponent(e.id) + '">' + (ZH ? '请求引荐' : 'Request an introduction') + '</a></p>';
    }
    function update() {
      var list = experts.filter(function (e) {
        return (!state.discipline || (e.disciplines || []).indexOf(state.discipline) > -1) && (!state.country || e.country === state.country) && (!state.sector || (e.sectors || []).indexOf(state.sector) > -1);
      });
      document.getElementById('count').textContent = list.length + ' ' + t('records');
      document.getElementById('experts').innerHTML = list.length ? list.map(card).join('') : '<div class="empty">' + esc(t('noResults')) + '</div>';
    }
    update();
    S.onHash(function (id) { var e = experts.filter(function (x) { return x.id === id; })[0]; if (e) S.modal(detail(e)); });
  });
})();
