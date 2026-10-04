/* Innovation Opportunities: filters, list and detail. */
(function () {
  'use strict';
  var S = window.SUES, K = window.SUES_CARDS, C = S.C, esc = S.esc, t = S.t;
  var q = S.qs();
  var state = { status: q.status || '', sector: q.sector || '', solution: q.solution || '', zone: q.zone || '' };
  S.loadAll().then(function (all) {
    var opps = K.newest(all.opportunities);
    S.exampleNotice(document.getElementById('notice'), opps);
    document.getElementById('filters').innerHTML =
      '<div><label for="f-status">' + esc(t('status')) + '</label><select id="f-status" data-k="status">' + S.options(C.opportunityStatuses, null, state.status) + '</select></div>' +
      '<div><label for="f-sector">' + esc(t('sector')) + '</label><select id="f-sector" data-k="sector">' + S.options(C.sectors, S.sectorLabel, state.sector) + '</select></div>' +
      '<div><label for="f-solution">' + esc(t('solution')) + '</label><select id="f-solution" data-k="solution">' + S.options(C.solutions, S.solutionLabel, state.solution) + '</select></div>' +
      '<div><label for="f-zone">' + esc(t('zone')) + '</label><select id="f-zone" data-k="zone">' + S.options(Object.keys(C.dsfZones), S.zoneLabel, state.zone) + '</select></div>';
    document.querySelectorAll('#filters [data-k]').forEach(function (el) { el.addEventListener('change', function () { state[el.getAttribute('data-k')] = el.value; update(); }); });
    function update() {
      S.setQs(state);
      var list = opps.filter(function (o) {
        return (!state.status || o.status === state.status) && (!state.sector || o.sector === state.sector) &&
          (!state.solution || o.solution_type === state.solution) && (!state.zone || S.zoneKey(o) === state.zone);
      });
      document.getElementById('count').textContent = list.length + ' ' + t('records');
      document.getElementById('list').innerHTML = list.length ? list.map(function (o) { return K.oppCard(o, { inPage: true }); }).join('') : '<div class="empty">' + esc(t('noResults')) + '</div>';
    }
    update();
    S.onHash(function (id) { var o = opps.filter(function (x) { return x.id === id; })[0]; if (o) S.modal(K.oppDetail(o, all)); });
  });
})();
