/* SUES Design Network: shared runtime.
   Renders the header and footer, loads data files, handles the language
   toggle, global search, modals, deep links, maps and calendar exports. */
(function () {
  'use strict';
  var C = window.SUES_CONFIG;
  var body = document.body;
  var root = body.getAttribute('data-root') || './';
  var page = body.getAttribute('data-page') || 'home';

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  var lang = store('sues-lang') || ((navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-Hans' : 'en');

  var I18N = {
    en: {
      search: 'Search the network', submit: 'Submit', signin: 'Sign in', menu: 'Menu',
      signal: 'Signal', story: 'Story', opportunity: 'Opportunity', event: 'Event', expert: 'Expert',
      noResults: 'No matching records.', example: 'Example record', draft: 'Draft, pending verification', consentPending: 'Consent pending',
      draftNotice: 'Draft records. Each record awaits the editor\'s check of its sources, and named people have not yet confirmed consent to be listed.', exampleNotice: 'Preview. The records shown are examples that illustrate the layout. Replace them with verified records before launch.',
      readMore: 'Read more', viewAll: 'View all', all: 'All', close: 'Close', source: 'Source',
      subscribeTitle: 'Weekly digest', subscribeText: 'Seven verified signals and an editorial pick, every Sunday.',
      email: 'Email address', subscribeBtn: 'Subscribe', subscribeLater: 'Subscriptions open at launch. Thank you for your interest.',
      aiNote: 'An AI agent drafts entries from verified sources. A human editor approves every entry before publication.',
      sections: 'Sections', impact: 'Impact', strength: 'Strength', zone: 'DSF zone', sector: 'Sector', solution: 'Solution',
      region: 'Region', keyword: 'Keyword', status: 'Status', type: 'Type', mode: 'Mode', from: 'From', to: 'To',
      records: 'records', clear: 'Clear filters', contributedBy: 'Contributed by', related: 'Related records',
      mapUnavailable: 'The map could not load. Locations are listed below.', place: 'Place', date: 'Date',
      production: 'Production', consumption: 'Consumption', local: 'Local', global: 'Global', individual: 'Individual', collective: 'Collective',
      placeholderZones: 'Zone names are placeholders until the Designing Sustainable Futures labels are confirmed.'
    },
    zh: {
      search: '搜索网络', submit: '提交', signin: '登录', menu: '菜单',
      signal: '信号', story: '案例', opportunity: '机会', event: '活动', expert: '专家',
      noResults: '没有匹配的记录。', example: '示例记录', draft: '草稿，待核实', consentPending: '待确认同意',
      draftNotice: '草稿记录。每条记录的来源尚待编辑核实，所列人物尚未确认同意公开。', exampleNotice: '预览。当前显示的是用于展示版式的示例记录，正式上线前将替换为经核实的记录。',
      readMore: '阅读全文', viewAll: '查看全部', all: '全部', close: '关闭', source: '来源',
      subscribeTitle: '每周简报', subscribeText: '每周日发送七条经核实的信号和一条编辑精选。',
      email: '电子邮箱', subscribeBtn: '订阅', subscribeLater: '订阅功能将在上线时开放，感谢关注。',
      aiNote: 'AI 代理依据经核实的来源起草条目，每条内容发布前均由人工编辑审核批准。',
      sections: '栏目', impact: '影响力', strength: '强度', zone: 'DSF 区域', sector: '领域', solution: '方案类型',
      region: '地区', keyword: '关键词', status: '状态', type: '类型', mode: '形式', from: '开始', to: '结束',
      records: '条记录', clear: '清除筛选', contributedBy: '贡献者', related: '相关记录',
      mapUnavailable: '地图无法加载，地点列于下方。', place: '地点', date: '日期',
      production: '生产', consumption: '消费', local: '本地', global: '全球', individual: '个人', collective: '集体',
      placeholderZones: '区域名称为占位标签，待《设计可持续未来》中的正式标签确认后替换。'
    }
  };
  function t(k) { return (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; }

  var NAV = [
    ['about', 'Who we are', '关于我们'],
    ['stories', 'Stories of Impact', '影响力案例'],
    ['signals', 'Sustainability Signals', '可持续信号'],
    ['opportunities', 'Innovation Opportunities', '创新机会'],
    ['dashboard', 'Impact Dashboard', '影响仪表板'],
    ['events', 'Ecosystem Events', '生态活动']
  ];
  var KIND_PATH = { signal: 'signals', story: 'stories', opportunity: 'opportunities', event: 'events', expert: 'about' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function L(rec, base) {
    if (!rec) return '';
    if (lang === 'zh' && rec[base + '_zh']) return rec[base + '_zh'];
    return rec[base + '_en'] || rec[base] || '';
  }
  function fromList(list, zhList, v) {
    var i = list.indexOf(v);
    return lang === 'zh' && i > -1 ? zhList[i] : v;
  }
  function sectorLabel(s) { return fromList(C.sectors, C.sectorsZh, s); }
  function solutionLabel(s) { return fromList(C.solutions, C.solutionsZh, s); }
  function zoneKey(r) { return r && r.dsf_production && r.dsf_consumption ? r.dsf_production + '-' + r.dsf_consumption : ''; }
  function zoneLabel(k) { var z = C.dsfZones[k]; return z ? z[lang] || z.en : ''; }
  function strengthLabel(s) { var x = C.strengths[s]; return x ? x[lang] || x.en : s; }
  function href(section, id) { return root + section + '/' + (id ? '#' + encodeURIComponent(id) : ''); }

  function parseDate(iso) { var p = String(iso || '').split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1); }
  function isoDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = parseDate(iso);
    if (lang === 'zh') return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function daysAgo(iso) { return Math.round((today() - parseDate(iso)) / 86400000); }
  function placeText(p) {
    if (!p) return '';
    return [p.venue, p.city, p.region, p.country].filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
  }

  function strengthBadge(s) { return s ? '<span class="badge s-' + esc(s) + '"><span class="dot"></span>' + esc(strengthLabel(s)) + '</span>' : ''; }
  function zoneBadge(r) { var k = zoneKey(r); return k ? '<span class="badge z-' + k + '"><span class="dot"></span>' + esc(zoneLabel(k)) + '</span>' : ''; }
  function exampleBadge(r) {
    if (!r) return '';
    if (r.example) return '<span class="badge example">' + esc(t('example')) + '</span>';
    if (r.draft || r.verification === 'pending') return '<span class="badge example">' + esc(t('draft')) + '</span>';
    return '';
  }
  function consentBadge(c) { return c === 'pending' ? '<span class="badge example">' + esc(t('consentPending')) + '</span>' : ''; }
  function impactDots(n) { n = +n || 0; var s = ''; for (var i = 1; i <= 5; i++) s += i <= n ? '\u25CF' : '\u25CB'; return '<span class="impact" title="' + esc(t('impact')) + ' ' + n + '/5" aria-label="' + esc(t('impact')) + ' ' + n + ' / 5">' + s + '</span>'; }
  function tagsHtml(tags) { return (tags || []).length ? '<div class="tags">' + tags.map(function (x) { return '<span class="tag">' + esc(x) + '</span>'; }).join('') + '</div>' : ''; }

  /* Data */
  var cache = {};
  function load(name) {
    if (!cache[name]) {
      cache[name] = fetch(root + 'data/' + name + '.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error(name + ' ' + r.status); return r.json(); })
        .then(function (d) { return Array.isArray(d) ? d.filter(function (x) { return !x.retracted || page !== 'home'; }) : d; })
        .catch(function (e) { console.error(e); return Array.isArray(cache[name]) ? [] : []; });
    }
    return cache[name];
  }
  function loadAll() {
    return Promise.all(['signals-data', 'stories-data', 'opportunities-data', 'events-data', 'experts-data'].map(load))
      .then(function (r) { return { signals: r[0], stories: r[1], opportunities: r[2], events: r[3], experts: r[4] }; });
  }
  function byId(all) {
    var m = {};
    [['signal', all.signals], ['story', all.stories], ['opportunity', all.opportunities], ['event', all.events], ['expert', all.experts]].forEach(function (p) {
      (p[1] || []).forEach(function (r) { m[r.id] = { kind: p[0], rec: r }; });
    });
    return m;
  }
  function relatedLinks(all, ids) {
    var m = byId(all);
    var items = (ids || []).map(function (id) {
      var x = m[id];
      if (!x) return '<li class="muted">' + esc(id) + '</li>';
      var title = x.kind === 'expert' ? x.rec.name : L(x.rec, 'title');
      return '<li><span class="muted small">' + esc(t(x.kind)) + '</span> <a href="' + href(KIND_PATH[x.kind], id) + '">' + esc(title) + '</a></li>';
    });
    return items.length ? '<ul class="link-list">' + items.join('') + '</ul>' : '';
  }

  /* Header and footer */
  var MARK = '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="7" fill="var(--accent)"/><path d="M16 5v22M5 16h22" stroke="var(--accent-ink)" stroke-width="1.4" opacity=".55"/><circle cx="10.5" cy="10.5" r="2.6" fill="var(--accent-ink)"/><circle cx="21.5" cy="10.5" r="1.8" fill="var(--accent-ink)"/><circle cx="10.5" cy="21.5" r="1.6" fill="var(--accent-ink)"/><circle cx="22" cy="21.5" r="3.1" fill="var(--accent-ink)"/></svg>';

  function renderHeader() {
    var h = document.createElement('header');
    h.className = 'site-header';
    h.innerHTML =
      '<div class="wrap hdr">' +
      '<a class="brand" href="' + root + '">' + MARK + '<span class="brand-text-full">' + esc(lang === 'zh' ? C.siteNameZh : C.siteName) + '</span><span class="brand-text-short">SUES</span></a>' +
      '<nav class="nav" id="site-nav" aria-label="' + esc(t('sections')) + '">' +
      NAV.map(function (n) {
        return '<a href="' + root + n[0] + '/"' + (page === n[0] ? ' aria-current="page"' : '') + '>' + esc(lang === 'zh' ? n[2] : n[1]) + '</a>';
      }).join('') + '</nav>' +
      '<div class="hdr-tools">' +
      '<div class="search-box"><label class="sr-only" for="site-search">' + esc(t('search')) + '</label><input id="site-search" type="search" placeholder="' + esc(t('search')) + '" autocomplete="off"><div class="search-results" id="search-results" role="listbox"></div></div>' +
      '<button class="lang-btn" id="lang-btn" type="button" aria-label="Language / 语言">' + (lang === 'zh' ? 'EN' : '中文') + '</button>' +
      '<a class="btn small btn-submit" href="' + root + 'members/">' + esc(t('submit')) + '</a>' +
      '<button class="menu-btn" id="menu-btn" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="' + esc(t('menu')) + '"><svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
      '</div></div>';
    body.insertBefore(h, body.firstChild);
    document.getElementById('lang-btn').addEventListener('click', function () {
      store('sues-lang', lang === 'zh' ? 'en' : 'zh');
      location.reload();
    });
    var mb = document.getElementById('menu-btn'), nav = document.getElementById('site-nav');
    mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
    initSearch();
  }

  function renderFooter() {
    var f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML =
      '<div class="wrap"><div class="foot-grid">' +
      '<div><h4>' + esc(t('subscribeTitle')) + '</h4><p>' + esc(t('subscribeText')) + '</p>' +
      '<form class="subscribe" id="subscribe-form"' + (C.subscribeEndpoint ? ' action="' + esc(C.subscribeEndpoint) + '" method="post"' : '') + '>' +
      '<label class="sr-only" for="sub-email">' + esc(t('email')) + '</label><input id="sub-email" name="email" type="email" required placeholder="' + esc(t('email')) + '">' +
      '<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button class="btn" type="submit">' + esc(t('subscribeBtn')) + '</button></form><p class="small muted" id="subscribe-msg" aria-live="polite"></p></div>' +
      '<div><h4>' + esc(t('sections')) + '</h4><ul class="link-list" style="list-style:none;padding:0">' +
      NAV.map(function (n) { return '<li><a href="' + root + n[0] + '/">' + esc(lang === 'zh' ? n[2] : n[1]) + '</a></li>'; }).join('') +
      '<li><a href="' + root + 'members/">' + esc(lang === 'zh' ? '会员区' : 'Member area') + '</a></li></ul></div>' +
      '<div><h4>SUES</h4><p>' + (lang === 'zh'
        ? '上海工程技术大学设计学院'
        : 'School of Design, Shanghai University of Engineering Science') + '</p>' +
      '<p class="small muted">' + esc(lang === 'zh' ? C.dataLicenceZh : C.dataLicence) + '</p>' +
      '<p class="small muted">' + esc(t('aiNote')) + '</p></div>' +
      '</div><div class="foot-base"><span>&copy; ' + new Date().getFullYear() + ' ' + esc(C.siteName) + '</span><span>www.sues.design/network</span></div></div>';
    body.appendChild(f);
    var form = document.getElementById('subscribe-form');
    form.addEventListener('submit', function (e) {
      if (form.website.value) { e.preventDefault(); return; }
      if (!C.subscribeEndpoint) { e.preventDefault(); document.getElementById('subscribe-msg').textContent = t('subscribeLater'); form.reset(); }
    });
  }

  /* Global search */
  function initSearch() {
    var input = document.getElementById('site-search'), box = document.getElementById('search-results'), timer;
    function run() {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { box.classList.remove('open'); return; }
      loadAll().then(function (all) {
        var out = [];
        function test(kind, r, fields) {
          var hay = fields.map(function (f) { var v = r[f]; return Array.isArray(v) ? v.join(' ') : (v && typeof v === 'object' ? JSON.stringify(v) : v || ''); }).join(' ').toLowerCase();
          if (hay.indexOf(q) > -1) out.push({ kind: kind, r: r });
        }
        all.signals.forEach(function (r) { test('signal', r, ['title_en', 'title_zh', 'tags', 'sector', 'solution', 'place', 'practitioners']); });
        all.stories.forEach(function (r) { test('story', r, ['title_en', 'title_zh', 'summary_en', 'place', 'tags']); });
        all.opportunities.forEach(function (r) { test('opportunity', r, ['title_en', 'title_zh', 'description', 'place', 'sector']); });
        all.events.forEach(function (r) { test('event', r, ['title_en', 'title_zh', 'organiser', 'place', 'type']); });
        all.experts.forEach(function (r) { test('expert', r, ['name', 'name_zh', 'organisation', 'disciplines', 'country']); });
        box.innerHTML = out.length ? out.slice(0, 12).map(function (x) {
          var title = x.kind === 'expert' ? x.r.name : L(x.r, 'title');
          return '<a role="option" href="' + href(KIND_PATH[x.kind], x.r.id) + '"><div class="kind">' + esc(t(x.kind)) + '</div>' + esc(title) + '</a>';
        }).join('') : '<div style="padding:12px 14px" class="muted small">' + esc(t('noResults')) + '</div>';
        box.classList.add('open');
      });
    }
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 160); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { box.classList.remove('open'); input.blur(); } });
    document.addEventListener('click', function (e) { if (!e.target.closest('.search-box')) box.classList.remove('open'); });
    box.addEventListener('click', function () { box.classList.remove('open'); });
  }

  /* Modal and deep links */
  var back;
  function modal(html, onClose) {
    if (!back) {
      back = document.createElement('div');
      back.className = 'modal-back';
      back.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><button class="close" type="button" aria-label="' + esc(t('close')) + '">\u00D7</button><div class="modal-body"></div></div>';
      body.appendChild(back);
      back.addEventListener('click', function (e) { if (e.target === back || e.target.closest('.close')) closeModal(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && back.classList.contains('open')) closeModal(); });
    }
    back._onClose = onClose;
    back.querySelector('.modal-body').innerHTML = html;
    back.classList.add('open');
    body.style.overflow = 'hidden';
    back.querySelector('.close').focus();
  }
  function closeModal() {
    if (!back) return;
    back.classList.remove('open');
    body.style.overflow = '';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (back._onClose) back._onClose();
  }
  function onHash(fn) {
    function go() { var id = decodeURIComponent(location.hash.slice(1)); if (id) fn(id); }
    window.addEventListener('hashchange', go);
    go();
  }
  function openRecord(id) { history.pushState(null, '', '#' + encodeURIComponent(id)); window.dispatchEvent(new HashChangeEvent('hashchange')); }

  function exampleNotice(el, records) {
    if (!el) return;
    var rs = records || [];
    if (rs.some(function (r) { return r && r.example; })) el.innerHTML = '<div class="notice"><strong>' + esc(t('example')) + '.</strong> ' + esc(t('exampleNotice')) + '</div>';
    else if (rs.some(function (r) { return r && (r.draft || r.consent === 'pending'); })) el.innerHTML = '<div class="notice"><strong>' + esc(t('draft')) + '.</strong> ' + esc(t('draftNotice')) + '</div>';
  }

  /* Query string helpers */
  function qs() { var o = {}; new URLSearchParams(location.search).forEach(function (v, k) { o[k] = v; }); return o; }
  function setQs(o) {
    var p = new URLSearchParams();
    Object.keys(o).forEach(function (k) { if (o[k]) p.set(k, o[k]); });
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }
  function options(list, labelFn, selected, allLabel) {
    return '<option value="">' + esc(allLabel || t('all')) + '</option>' + list.map(function (v) {
      return '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(labelFn ? labelFn(v) : v) + '</option>';
    }).join('');
  }

  /* Map (Leaflet, loaded on demand, with a list fallback) */
  var leaflet;
  function loadLeaflet() {
    if (!leaflet) {
      leaflet = new Promise(function (res, rej) {
        if (window.L && window.L.map) return res(window.L);
        var css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(css);
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        s.onload = function () { res(window.L); };
        s.onerror = rej;
        document.head.appendChild(s);
        setTimeout(function () { rej(new Error('timeout')); }, 9000);
      });
    }
    return leaflet;
  }
  function map(el, points) {
    if (!el) return;
    var pts = points.filter(function (p) { return isFinite(p.lat) && isFinite(p.lng); });
    function fallback() {
      el.classList.remove('map');
      el.innerHTML = '<div class="map-fallback panel"><p class="muted">' + esc(t('mapUnavailable')) + '</p><ul class="link-list">' +
        pts.map(function (p) { return '<li><a href="' + p.href + '">' + esc(p.title) + '</a> <span class="muted">' + esc(p.place || '') + '</span></li>'; }).join('') + '</ul></div>';
    }
    if (!pts.length) { el.innerHTML = '<div class="empty">' + esc(t('noResults')) + '</div>'; el.classList.remove('map'); return; }
    loadLeaflet().then(function (Lf) {
      el.innerHTML = '';
      if (el._map) el._map.remove();
      var m = Lf.map(el, { scrollWheelZoom: false, worldCopyJump: true });
      el._map = m;
      Lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(m);
      var group = [];
      pts.forEach(function (p) {
        var mk = Lf.circleMarker([p.lat, p.lng], { radius: 8, color: '#fff', weight: 2, fillColor: p.color || '#1f6f5c', fillOpacity: 0.9 }).addTo(m);
        mk.bindPopup('<strong><a href="' + p.href + '">' + esc(p.title) + '</a></strong><br><span>' + esc(p.place || '') + '</span>');
        group.push([p.lat, p.lng]);
      });
      if (group.length === 1) m.setView(group[0], 5); else m.fitBounds(group, { padding: [30, 30], maxZoom: 6 });
    }).catch(fallback);
  }

  /* Calendar export */
  function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function ics(events, name) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SUES Design Network//Ecosystem Events//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + icsEscape(name || 'SUES Design Network events')];
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    events.forEach(function (e) {
      var end = parseDate(e.end_date || e.start_date); end.setDate(end.getDate() + 1);
      lines.push('BEGIN:VEVENT', 'UID:' + e.id + '@sues.design', 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + e.start_date.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + isoDate(end).replace(/-/g, ''),
        'SUMMARY:' + icsEscape(e.title_en), 'LOCATION:' + icsEscape(e.mode === 'online' ? 'Online' : placeText(e.place)),
        'DESCRIPTION:' + icsEscape((e.organiser ? e.organiser + '. ' : '') + (e.registration_url || '')),
        'URL:' + C.canonicalBase + 'events/#' + e.id, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }
  function download(filename, text, mime) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' }));
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  window.SUES = {
    C: C, root: root, page: page, lang: lang, t: t, L: L, esc: esc,
    sectorLabel: sectorLabel, solutionLabel: solutionLabel, zoneKey: zoneKey, zoneLabel: zoneLabel, strengthLabel: strengthLabel,
    href: href, parseDate: parseDate, isoDate: isoDate, today: today, fmtDate: fmtDate, daysAgo: daysAgo, placeText: placeText,
    strengthBadge: strengthBadge, zoneBadge: zoneBadge, exampleBadge: exampleBadge, consentBadge: consentBadge, impactDots: impactDots, tagsHtml: tagsHtml,
    load: load, loadAll: loadAll, byId: byId, relatedLinks: relatedLinks,
    modal: modal, closeModal: closeModal, onHash: onHash, openRecord: openRecord, exampleNotice: exampleNotice,
    qs: qs, setQs: setQs, options: options, map: map, ics: ics, download: download, store: store
  };

  renderHeader();
  renderFooter();
})();
