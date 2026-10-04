/* Home page */
(function () {
  'use strict';
  var S = window.SUES, K = window.SUES_CARDS, esc = S.esc, ZH = S.lang === 'zh';
  S.loadAll().then(function (all) {
    S.exampleNotice(document.getElementById('notice'), [].concat(all.signals, all.stories));

    var sig = all.signals.filter(function (s) { return s.content_type !== 'monthly_synthesis' && !s.retracted; });
    var latest = K.newest(sig)[0];
    var hero = document.getElementById('hero-signal');
    if (latest) {
      var day = sig.filter(function (s) { return s.date === latest.date; })
        .sort(function (a, b) { return (b.impact_score || 0) - (a.impact_score || 0); })[0];
      hero.innerHTML = '<div class="kicker" style="font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;color:var(--accent);font-weight:700">' +
        (ZH ? '今日信号' : 'Signal of the day') + '</div>' +
        '<div class="meta">' + esc(S.fmtDate(day.date)) + ' ' + S.strengthBadge(day.signal_strength) + S.zoneBadge(day) + S.exampleBadge(day) + '</div>' +
        '<h2><a href="' + S.href('signals', day.id) + '" style="color:inherit">' + esc(S.L(day, 'title')) + '</a></h2>' +
        (!ZH && day.title_zh ? '<div class="zh">' + esc(day.title_zh) + '</div>' : '') +
        '<p>' + esc(day.body && day.body.signal) + '</p>' +
        '<div class="meta">' + esc(S.sectorLabel(day.sector)) + ' &middot; ' + esc(S.solutionLabel(day.solution)) + ' &middot; ' + esc(S.placeText(day.place)) + ' &middot; ' + S.impactDots(day.impact_score) + '</div>' +
        '<a class="more" href="' + S.href('signals', day.id) + '">' + esc(S.t('readMore')) + '</a>';
    } else {
      hero.innerHTML = '<div class="empty">' + (ZH ? '暂无信号。' : 'No signals published yet.') + '</div>';
    }

    K.dsfMap(document.getElementById('dsf-map'), K.zoneCounts(sig));
    K.zoneNote(document.getElementById('zone-note'));

    function fill(id, list, render, empty) {
      document.getElementById(id).innerHTML = list.length ? list.map(function (x) { return render(x); }).join('') : '<div class="empty">' + esc(empty) + '</div>';
    }
    fill('latest-stories', K.newest(all.stories).slice(0, 3), K.storyCard, ZH ? '暂无案例。' : 'No stories published yet.');
    fill('open-opps', K.newest(all.opportunities.filter(function (o) { return o.status !== 'Closed'; })).slice(0, 3), K.oppCard, ZH ? '暂无开放的机会。' : 'No open opportunities.');
    var now = S.today(), horizon = new Date(now); horizon.setDate(horizon.getDate() + 30);
    var next = all.events.filter(function (e) {
      return e.status !== 'cancelled' && S.parseDate(e.end_date || e.start_date) >= now && S.parseDate(e.start_date) <= horizon;
    }).sort(function (a, b) { return a.start_date.localeCompare(b.start_date); });
    fill('next-events', next, K.eventCard, ZH ? '未来 30 天暂无活动。' : 'No events in the next 30 days.');
  });
})();
