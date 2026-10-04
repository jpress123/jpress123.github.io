/* Member area: submission forms with automatic checks, drafts and My submissions.
   Submissions POST as JSON to SUES_CONFIG.formEndpoint. Until a backend is
   connected they are kept on this device and can be downloaded for the editor. */
(function () {
  'use strict';
  var S = window.SUES, C = S.C, esc = S.esc, ZH = S.lang === 'zh';
  var EMDASH = /[\u2014\u2015]/;
  var DAILY_LIMIT = 5;

  function tx(en, zh) { return ZH ? zh : en; }
  var zoneOpts = Object.keys(C.dsfZones);
  var FORMS = {
    suggest: { label: tx('Suggest a signal', '推荐信号'), who: tx('Anyone. Enters the queue marked Suggested.', '所有人可用，进入队列并标记为“推荐”。'), fields: [
      ['name', 'text', tx('Your name', '您的姓名'), 1], ['email', 'email', tx('Email', '电子邮箱'), 1],
      ['source_url', 'url', tx('Source URL', '来源链接'), 1], ['title', 'text', tx('Headline, 12 words or fewer', '标题（不超过 12 个英文单词）'), 1],
      ['note', 'textarea', tx('What happened', '发生了什么'), 0]] },
    signal: { label: tx('Submit a signal', '提交信号'), who: tx('Members', '会员'), fields: [
      ['source_url', 'url', tx('Source URL', '来源链接'), 1], ['source_name', 'text', tx('Publication and date', '出版物与日期'), 0],
      ['title_en', 'text', tx('Headline, 12 words or fewer', '标题（不超过 12 个英文单词）'), 1], ['title_zh', 'text', tx('Chinese headline (optional)', '中文标题（可选）'), 0],
      ['sector', 'select', tx('Sector', '领域'), 1, C.sectors], ['solution', 'select', tx('Solution type', '方案类型'), 1, C.solutions],
      ['dsf_production', 'select', tx('DSF production', 'DSF 生产'), 1, ['local', 'global']], ['dsf_consumption', 'select', tx('DSF consumption', 'DSF 消费'), 1, ['individual', 'collective']],
      ['signal', 'textarea', tx('What happened, 2 to 3 sentences', '发生了什么（2 至 3 句）'), 1],
      ['country', 'text', tx('Country', '国家'), 1], ['city', 'text', tx('City or region', '城市或地区'), 0],
      ['practitioners', 'text', tx('Practitioner or organisation', '实践者或机构'), 0],
      ['suggested_strength', 'select', tx('Your suggested strength', '您建议的强度'), 0, Object.keys(C.strengths)],
      ['suggested_impact', 'select', tx('Your suggested impact score', '您建议的影响力评分'), 0, ['1', '2', '3', '4', '5']]] },
    story: { label: tx('Submit a story', '提交案例'), who: tx('Members', '会员'), fields: [
      ['title_en', 'text', tx('Title, 12 words or fewer', '标题（不超过 12 个英文单词）'), 1], ['summary_en', 'text', tx('One-line summary', '一句话摘要'), 1],
      ['country', 'text', tx('Country', '国家'), 1], ['city', 'text', tx('City or region', '城市或地区'), 1],
      ['practitioners', 'textarea', tx('Practitioners: name, organisation, role (one per line)', '实践者：姓名、机构、角色（每行一位）'), 1],
      ['consent', 'checkbox', tx('Every practitioner named has given written consent to be published.', '所列每位实践者均已书面同意公开署名。'), 1],
      ['challenge', 'textarea', tx('Challenge, 2 to 3 sentences', '挑战（2 至 3 句）'), 1], ['solution', 'textarea', tx('Solution: what was built or changed, and how', '方案：建造或改变了什么，如何实现'), 1],
      ['sector', 'select', tx('Sector', '领域'), 1, C.sectors], ['solution_type', 'select', tx('Solution type', '方案类型'), 1, C.solutions],
      ['status', 'select', tx('Status', '状态'), 1, C.storyStatuses],
      ['results', 'textarea', tx('Results, one per line: label | value | unit | baseline | period | source', '成果（每行一项）：名称 | 数值 | 单位 | 基线 | 期间 | 来源'), 1],
      ['evidence', 'textarea', tx('Evidence links, one per line', '证据链接（每行一个）'), 1],
      ['image_url', 'url', tx('Lead image URL (optional)', '主图链接（可选）'), 0], ['image_licence', 'text', tx('Image licence note', '图片许可说明'), 0]] },
    need: { label: tx('Post a need', '发布需求'), who: tx('Signed-in members and verified visitors', '已登录会员与已验证访客'), fields: [
      ['organisation', 'text', tx('City, community, company, NGO or school', '城市、社区、企业、非政府组织或学校'), 1], ['email', 'email', tx('Contact email (kept private)', '联系邮箱（不公开）'), 1],
      ['title_en', 'text', tx('Need in one line', '一句话描述需求'), 1], ['description', 'textarea', tx('Description', '详细描述'), 1],
      ['country', 'text', tx('Country', '国家'), 1], ['city', 'text', tx('City or region', '城市或地区'), 1],
      ['sector', 'select', tx('Sector', '领域'), 1, C.sectors], ['solution_type', 'select', tx('Solution type', '方案类型'), 1, C.solutions],
      ['scale', 'text', tx('Scale', '规模'), 1], ['timeline', 'text', tx('Timeline', '时间'), 1], ['budget_band', 'text', tx('Budget band (optional)', '预算区间（可选）'), 0]] },
    event: { label: tx('Submit an event', '提交活动'), who: tx('Members', '会员'), fields: [
      ['title_en', 'text', tx('Event name', '活动名称'), 1], ['type', 'select', tx('Type', '类型'), 1, C.eventTypes],
      ['start_date', 'date', tx('Start date', '开始日期'), 1], ['end_date', 'date', tx('End date', '结束日期'), 0],
      ['mode', 'select', tx('Mode', '形式'), 1, ['in person', 'online', 'hybrid']], ['place', 'text', tx('Venue, city and country, or Online', '场地、城市与国家，或线上'), 1],
      ['organiser', 'text', tx('Organiser', '主办方'), 1], ['registration_url', 'url', tx("Organiser's registration page", '主办方报名页面'), 1],
      ['sector', 'select', tx('Sector', '领域'), 0, C.sectors]] },
    intro: { label: tx('Request an introduction', '请求引荐'), who: tx('Anyone', '所有人'), fields: [
      ['name', 'text', tx('Your name', '您的姓名'), 1], ['email', 'email', tx('Email', '电子邮箱'), 1], ['organisation', 'text', tx('Organisation', '机构'), 0],
      ['ref', 'text', tx('Record ID (opportunity or expert)', '记录编号（机会或专家）'), 1], ['message', 'textarea', tx('What you would like to discuss', '希望讨论的内容'), 1]] }
  };
  var ORDER = ['suggest', 'signal', 'story', 'need', 'event', 'intro'];
  var LABELS = { local: tx('Local', '本地'), global: tx('Global', '全球'), individual: tx('Individual', '个人'), collective: tx('Collective', '集体') };

  var q = S.qs();
  var current = FORMS[q.form] ? q.form : 'suggest';
  var archiveUrls = {};

  function norm(u) { return String(u || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[#?].*$/, '').replace(/\/$/, ''); }
  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
  function isUrl(s) { return /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(String(s || '').trim()); }
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim()); }

  function getList() { try { return JSON.parse(S.store('sues-submissions') || '[]'); } catch (e) { return []; } }
  function setList(l) { S.store('sues-submissions', JSON.stringify(l)); }

  function optLabel(v) {
    if (LABELS[v]) return LABELS[v];
    if (C.strengths[v]) return S.strengthLabel(v);
    if (C.sectors.indexOf(v) > -1) return S.sectorLabel(v);
    if (C.solutions.indexOf(v) > -1) return S.solutionLabel(v);
    return v;
  }

  function renderTabs() {
    document.getElementById('forms-tabs').innerHTML = ORDER.map(function (k) {
      return '<button role="tab" type="button" data-form="' + k + '" aria-selected="' + (k === current) + '">' + esc(FORMS[k].label) + '</button>';
    }).join('');
    document.querySelectorAll('#forms-tabs [data-form]').forEach(function (b) {
      b.addEventListener('click', function () { current = b.getAttribute('data-form'); S.setQs({ form: current }); renderTabs(); renderForm(); });
    });
  }

  function renderForm() {
    var f = FORMS[current];
    var draft = {}; try { draft = JSON.parse(S.store('sues-draft-' + current) || '{}'); } catch (e) { draft = {}; }
    if (current === 'intro' && q.ref && !draft.ref) draft.ref = q.ref;
    var html = '<h2>' + esc(f.label) + '</h2><p class="small muted">' + tx('Who can use it: ', '适用对象：') + esc(f.who) + '</p>';
    f.fields.forEach(function (fd) {
      var id = 'fld-' + fd[0], v = draft[fd[0]] || '', req = fd[3] ? ' <span aria-hidden="true">*</span>' : '';
      if (fd[1] === 'checkbox') {
        html += '<div class="field check"><label><input type="checkbox" id="' + id + '" name="' + fd[0] + '"' + (v ? ' checked' : '') + '> <span>' + esc(fd[2]) + req + '</span></label></div>';
      } else if (fd[1] === 'select') {
        html += '<div class="field"><label for="' + id + '">' + esc(fd[2]) + req + '</label><select id="' + id + '" name="' + fd[0] + '"><option value=""></option>' +
          fd[4].map(function (o) { return '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(optLabel(o)) + '</option>'; }).join('') + '</select></div>';
      } else if (fd[1] === 'textarea') {
        html += '<div class="field"><label for="' + id + '">' + esc(fd[2]) + req + '</label><textarea id="' + id + '" name="' + fd[0] + '">' + esc(v) + '</textarea></div>';
      } else {
        html += '<div class="field"><label for="' + id + '">' + esc(fd[2]) + req + '</label><input id="' + id + '" name="' + fd[0] + '" type="' + fd[1] + '" value="' + esc(v) + '"></div>';
      }
    });
    if (current === 'signal') html += '<p class="small muted">' + esc(S.t('placeholderZones')) + ' ' + zoneOpts.map(function (z) { return S.zoneLabel(z) + ' = ' + LABELS[C.dsfZones[z].x] + ' / ' + LABELS[C.dsfZones[z].y]; }).join('; ') + '</p>';
    html += '<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="field check"><label><input type="checkbox" name="credit"' + (draft.credit ? ' checked' : '') + '> <span>' + tx('Show my name and organisation as "Contributed by" on the published record.', '在发布的记录上以“贡献者”显示我的姓名与机构。') + '</span></label></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="submit">' + tx('Submit for review', '提交审核') + '</button><button class="btn ghost" type="button" id="clear-draft">' + tx('Clear draft', '清除草稿') + '</button></div>' +
      '<p class="small" id="form-msg" aria-live="polite" style="margin-top:10px"></p>';
    var form = document.getElementById('form');
    form.innerHTML = html;
    form.oninput = form.onchange = function () { S.store('sues-draft-' + current, JSON.stringify(read())); renderChecks(); };
    form.onsubmit = submit;
    document.getElementById('clear-draft').onclick = function () { S.store('sues-draft-' + current, '{}'); renderForm(); };
    renderChecks();
  }

  function read() {
    var form = document.getElementById('form'), o = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
    });
    return o;
  }

  function checks(d) {
    var f = FORMS[current], out = [];
    var missing = f.fields.filter(function (fd) { return fd[3] && !d[fd[0]]; }).map(function (fd) { return fd[2]; });
    out.push([!missing.length, tx('Required fields complete', '必填项已完成') + (missing.length ? ' (' + missing.length + tx(' missing', ' 项未填') + ')' : '')]);
    var text = Object.keys(d).map(function (k) { return typeof d[k] === 'string' ? d[k] : ''; }).join(' ');
    out.push([!EMDASH.test(text), tx('No em-dash (use commas, periods or "to")', '不含长破折号（请用逗号、句号或“至”）')]);
    if ('source_url' in d) {
      out.push([isUrl(d.source_url), tx('Source URL is a full web address', '来源链接为完整网址')]);
      out.push([!d.source_url || !archiveUrls[norm(d.source_url)], tx('Source URL is not already in the archive', '来源链接未在档案中出现')]);
    }
    var title = d.title_en !== undefined ? d.title_en : d.title;
    if (title !== undefined && current !== 'need' && current !== 'event') out.push([title && words(title) <= 12, tx('Headline is 12 words or fewer', '标题不超过 12 个英文单词') + ' (' + words(title) + ')']);
    if ('email' in d) out.push([isEmail(d.email), tx('Email address is valid', '电子邮箱格式正确')]);
    if (current === 'story') {
      out.push([!!d.consent, tx('Consent box ticked', '已勾选同意')]);
      var lines = String(d.results || '').split('\n').filter(function (l) { return l.trim(); });
      var good = lines.length && lines.every(function (l) { var p = l.split('|').map(function (x) { return x.trim(); }); return p.length >= 5 && p[1] && !isNaN(parseFloat(p[1])) && p[2] && p[3] && p[4]; });
      out.push([!!good, tx('Each result has a value, unit, baseline and period', '每项成果均有数值、单位、基线和期间')]);
      out.push([!d.image_url || !!d.image_licence, tx('Each image has a licence note', '每张图片均有许可说明')]);
    }
    if (current === 'need') out.push([d.description.length >= 80 && d.description.length <= 2000, tx('Description is 80 to 2,000 characters', '描述长度为 80 至 2000 字符') + ' (' + d.description.length + ')']);
    if (current === 'event') {
      out.push([isUrl(d.registration_url), tx("Organiser's page is a full web address", '主办方页面为完整网址')]);
      out.push([d.start_date && S.parseDate(d.start_date) > S.today(), tx('Date is in the future', '日期在未来')]);
      out.push([!d.end_date || d.end_date >= d.start_date, tx('End date is on or after the start date', '结束日期不早于开始日期')]);
    }
    var todayIso = S.isoDate(S.today());
    var n = getList().filter(function (s) { return (s.submitted_at || '').slice(0, 10) === todayIso; }).length;
    out.push([n < DAILY_LIMIT, tx('Daily limit of 5 submissions', '每日提交上限 5 次') + ' (' + n + '/5)']);
    return out;
  }

  function renderChecks() {
    var list = checks(read());
    document.getElementById('checks').innerHTML = list.map(function (c) { return '<li class="' + (c[0] ? 'ok' : 'bad') + '">' + esc(c[1]) + '</li>'; }).join('') +
      '<li class="na">' + tx('The editor opens every link before approval.', '编辑会在批准前打开每个链接。') + '</li>';
  }

  function submit(e) {
    e.preventDefault();
    var d = read(), msg = document.getElementById('form-msg');
    if (d.website) return;
    var failed = checks(d).filter(function (c) { return !c[0]; });
    if (failed.length) { msg.textContent = tx('Please resolve the checks marked with a cross.', '请先解决标记为叉号的检查项。'); return; }
    delete d.website;
    var rec = {
      submission_id: 'sub-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      form: current, state: current === 'suggest' ? 'Suggested' : 'Submitted', submitted_at: new Date().toISOString(), lang: S.lang, data: d
    };
    function done(sent) {
      rec.sent = sent;
      var l = getList(); l.unshift(rec); setList(l);
      S.store('sues-draft-' + current, '{}');
      renderForm();
      document.getElementById('form-msg').textContent = sent
        ? tx('Thank you. Your submission is in the editor queue.', '感谢提交，您的内容已进入编辑审核队列。')
        : tx('Saved on this device. The member portal backend is not connected yet, so download the file under My submissions and send it to the editor.', '已保存在本设备。会员门户后台尚未连接，请在“我的提交”中下载文件并发送给编辑。');
      renderMine();
    }
    if (C.formEndpoint) {
      fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(rec) })
        .then(function (r) { done(r.ok); }).catch(function () { done(false); });
    } else done(false);
  }

  function renderMine() {
    var l = getList(), el = document.getElementById('mine');
    if (!l.length) { el.innerHTML = '<p class="muted small">' + tx('No submissions on this device yet.', '本设备暂无提交。') + '</p>'; return; }
    el.innerHTML = '<p class="small muted">' + tx('States: Draft, Submitted, In review, Needs changes, Approved, Published, Declined.', '状态：草稿、已提交、审核中、需修改、已批准、已发布、已拒绝。') + '</p><div class="table-wrap"><table class="data"><thead><tr><th>' + tx('Date', '日期') + '</th><th>' + tx('Form', '表单') + '</th><th>' + tx('Title', '标题') + '</th><th>' + tx('State', '状态') + '</th><th></th></tr></thead><tbody>' +
      l.map(function (s, i) {
        var title = s.data.title_en || s.data.title || s.data.ref || '';
        return '<tr><td>' + esc(S.fmtDate(s.submitted_at.slice(0, 10))) + '</td><td>' + esc(FORMS[s.form] ? FORMS[s.form].label : s.form) + '</td><td>' + esc(title) + '</td><td>' + esc(s.state) + (s.sent ? '' : ' <span class="badge example">' + tx('not sent', '未发送') + '</span>') + '</td>' +
          '<td><button class="btn ghost small" type="button" data-dl="' + i + '">' + tx('Download', '下载') + '</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    el.querySelectorAll('[data-dl]').forEach(function (b) {
      b.addEventListener('click', function () { var s = l[+b.getAttribute('data-dl')]; S.download(s.submission_id + '.json', JSON.stringify(s, null, 2), 'application/json'); });
    });
  }

  if (!C.formEndpoint) {
    document.getElementById('backend-note').innerHTML = '<div class="notice"><strong>' + tx('Portal preview.', '门户预览。') + '</strong> ' +
      tx('The submission backend is not connected yet. Forms run their checks and save on this device; download a submission to send it to the editor.', '提交后台尚未连接。表单会执行检查并保存在本设备上，您可下载提交内容发送给编辑。') + '</div>';
  }
  document.getElementById('signin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('signin-msg').textContent = C.formEndpoint
      ? tx('If your email is registered, a sign-in link is on its way.', '如果您的邮箱已注册，登录链接即将发送。')
      : tx('Sign-in opens when the member portal backend is connected.', '会员门户后台连接后即可登录。');
  });

  S.load('signals-data').then(function (sig) {
    sig.forEach(function (s) { archiveUrls[norm(s.source_url)] = 1; });
    renderTabs(); renderForm(); renderMine();
  });
})();
