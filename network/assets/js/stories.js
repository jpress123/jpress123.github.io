/* Stories of Impact: map, filters, list and detail. */
(function () {
  'use strict';
  var S = window.SUES, K = window.SUES_CARDS, C = S.C, esc = S.esc, t = S.t;
  var q = S.qs();
  var state = { status: q.status || '', sector: q.sector || '', zone: q.zone || '', region: q.region || '' };
  S.loadAll().then(function (all) {
    var stories = K.newest(all.stories);
    S.exampleNotice(document.getElementById('notice'), stories);
    var countries = Array.from(new Set(stories.map(function (s) { return (s.place || {}).country; }).filter(Boolean))).sort();
    document.getElementById('filters').innerHTML =
      '<div><label for="f-status">' + esc(t('status')) + '</label><select id="f-status" data-k="status">' + S.options(C.storyStatuses, null, state.status) + '</select></div>' +
      '<div><label for="f-sector">' + esc(t('sector')) + '</label><select id="f-sector" data-k="sector">' + S.options(C.sectors, S.sectorLabel, state.sector) + '</select></div>' +
      '<div><label for="f-zone">' + esc(t('zone')) + '</label><select id="f-zone" data-k="zone">' + S.options(Object.keys(C.dsfZones), S.zoneLabel, state.zone) + '</select></div>' +
      '<div><label for="f-region">' + esc(t('region')) + '</label><select id="f-region" data-k="region">' + S.options(countries, null, state.region) + '</select></div>';
    document.querySelectorAll('#filters [data-k]').forEach(function (el) { el.addEventListener('change', function () { state[el.getAttribute('data-k')] = el.value; update(); }); });
    function update() {
      S.setQs(state);
      var list = stories.filter(function (s) {
        return (!state.status || s.status === state.status) && (!state.sector || (s.solution || {}).sector === state.sector) &&
          (!state.zone || S.zoneKey(s) === state.zone) && (!state.region || (s.place || {}).country === state.region);
      });
      document.getElementById('count').textContent = list.length + ' ' + t('records');
      document.getElementById('list').innerHTML = list.length ? list.map(function (s) { return K.storyCard(s, { inPage: true }); }).join('') : '<div class="empty">' + esc(t('noResults')) + '</div>';
      S.map(document.getElementById('map'), list.map(function (s) {
        return { lat: (s.place || {}).lat, lng: (s.place || {}).lng, title: S.L(s, 'title'), place: S.placeText(s.place), href: '#' + encodeURIComponent(s.id), color: K.ZONE_COLOR[S.zoneKey(s)] };
      }));
    }
    update();
    S.onHash(function (id) { var s = stories.filter(function (x) { return x.id === id; })[0]; if (s) S.modal(K.storyDetail(s, all)); });
  });
})();
