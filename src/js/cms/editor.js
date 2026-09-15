/*! Asobi CMS editor — color tabs + theme resolve */
(function () {
  var C = window.ASOBI_CMS;
  var S = window.ASOBI_SESSION;
  var API = window.ASOBI_API;
  var San = window.ASOBI_SANITIZE;
  var Render = window.ASOBI_RENDER;
  var Attach = window.ASOBI_ATTACH;
  var $ = function (id) { return document.getElementById(id); };
  var state = { user: null, type: null, id: null, path: null, data: null, saving: false };

  function setColorTab(name) {
    document.querySelectorAll('[data-color-tab]').forEach(function (b) {
      var on = b.getAttribute('data-color-tab') === name;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-color-panel]').forEach(function (p) {
      var on = p.getAttribute('data-color-panel') === name;
      p.classList.toggle('active', on);
      if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
    });
  }

  function qs(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }
  function setStatus(t, isErr) {
    var el = $('save-status');
    if (!el) return;
    el.textContent = t || '';
    el.className = 'status-line' + (isErr ? ' err' : (t && t.indexOf('保存しました') >= 0 ? ' ok' : ''));
  }
  function showErr(t) {
    var el = $('form-error');
    if (!el) return;
    if (!t) { el.classList.add('hidden'); el.textContent = ''; return; }
    el.textContent = t;
    el.classList.remove('hidden');
  }
  function fillSelect(el, options, value) {
    if (!el) return;
    el.innerHTML = '';
    options.forEach(function (o) {
      var opt = document.createElement('option');
      if (typeof o === 'string') { opt.value = o; opt.textContent = o; }
      else { opt.value = o.key; opt.textContent = o.label; }
      el.appendChild(opt);
    });
    if (value != null) el.value = value;
  }
  function bindRtToolbars() {
    if (window.ASOBI_RT && window.ASOBI_RT.bindRtToolbars) {
      window.ASOBI_RT.bindRtToolbars();
      return;
    }
    document.querySelectorAll('.rt-toolbar').forEach(function (tb) {
      var targetId = tb.getAttribute('data-for');
      tb.querySelectorAll('button[data-cmd]').forEach(function (btn) {
        btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
        btn.addEventListener('click', function () {
          var area = $(targetId);
          if (area) area.focus();
          try {
            document.execCommand(btn.getAttribute('data-cmd'), false, btn.getAttribute('data-val') || null);
          } catch (err) {}
        });
      });
    });
  }

  function renderFileList(attachments) {
    var list = $('g-file-list');
    if (!list) return;
    list.innerHTML = '';
    (attachments || []).forEach(function (a, idx) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="fname"></span> <span class="mono muted">[' + (a.mode || 'link') + ']</span> ';
      li.querySelector('.fname').textContent = a.name || a.path;
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn ghost sm';
      rm.textContent = '削除';
      rm.onclick = function () {
        if (!state.data || !state.data.attachments) return;
        state.data.attachments.splice(idx, 1);
        renderFileList(state.data.attachments);
      };
      li.appendChild(rm);
      list.appendChild(li);
    });
  }
  function showPendingFiles() {
    var input = $('g-file');
    var box = $('g-pending');
    if (!box) return;
    if (!input || !input.files || !input.files.length) {
      box.textContent = '';
      box.classList.add('hidden');
      return;
    }
    var names = [];
    for (var i = 0; i < input.files.length; i++) names.push(input.files[i].name);
    box.textContent = '保存時にアップロード: ' + names.join(', ');
    box.classList.remove('hidden');
  }

  function textContentSafe(el) {
    return el ? String(el.textContent || '').trim() : '';
  }
  function slotFromDoc(doc, name, asHtml) {
    var el = doc.querySelector('[data-cms-slot="' + name + '"]');
    if (!el) return asHtml ? '<p></p>' : '';
    if (asHtml) return (el.innerHTML || '').trim() || '<p></p>';
    return textContentSafe(el);
  }
  function groupKeyFromLabel(label) {
    var list = C.GROUPS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].label === label) return list[i].key;
    }
    return list[0] ? list[0].key : '';
  }

  function bootstrapMemberFromHtml(id, html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var title = textContentSafe(doc.querySelector('h1.page-title')) || id;
    var groupLabel = slotFromDoc(doc, 'groupLabel', false);
    var fav = slotFromDoc(doc, 'favoriteColor', false);
    if (fav === '—' || fav === '-') fav = '';
    var hobbies = slotFromDoc(doc, 'hobbies', false);
    if (hobbies === '—' || hobbies === '-') hobbies = '';
    return {
      schemaVersion: 1, type: 'member', memberId: id, displayName: title,
      class: slotFromDoc(doc, 'class', false), groupKey: groupKeyFromLabel(groupLabel),
      favoriteColor: fav, favoriteColorHex: null, hobbies: hobbies,
      hobbyTriggerHtml: slotFromDoc(doc, 'hobbyTrigger', true),
      growthHtml: slotFromDoc(doc, 'growth', true), messageHtml: slotFromDoc(doc, 'message', true),
      htmlPath: 'pages/members/' + id + '.html',
      updatedAt: new Date().toISOString(), updatedBy: (state.user && state.user.id) || 'bootstrap'
    };
  }
  function bootstrapGroupFromHtml(id, htmlPath, html) {
    var g = C.groupByKey(id);
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return {
      schemaVersion: 1, type: 'group', groupKey: id, label: (g && g.label) || id, htmlPath: htmlPath,
      goalHtml: slotFromDoc(doc, 'goal', true), whatHtml: slotFromDoc(doc, 'what', true),
      whyHtml: slotFromDoc(doc, 'why', true), howHtml: slotFromDoc(doc, 'how', true),
      resultHtml: slotFromDoc(doc, 'result', true), attachments: [],
      updatedAt: new Date().toISOString(), updatedBy: (state.user && state.user.id) || 'bootstrap'
    };
  }

  function applyMemberForm(j) {
    state.data = j;
    $('ed-title').textContent = j.displayName || state.id;
    $('ed-path').textContent = state.path;
    fillSelect($('m-class'), C.CLASSES, j.class);
    fillSelect($('m-group'), C.GROUPS, j.groupKey);
    $('m-color').value = j.favoriteColor || '';
    if (j.favoriteColorHex) {
      if ($('m-color-hex')) $('m-color-hex').value = j.favoriteColorHex;
      if ($('m-color-code')) $('m-color-code').value = j.favoriteColorHex;
    }
    setColorTab(j.favoriteColorHex ? 'picker' : 'text');
    $('m-hobbies').value = j.hobbies || '';
    $('m-hobby-trigger').innerHTML = j.hobbyTriggerHtml || '<p></p>';
    $('m-growth').innerHTML = j.growthHtml || '<p></p>';
    $('m-message').innerHTML = j.messageHtml || '<p></p>';
    $('form-member').classList.remove('hidden');
    $('form-group').classList.add('hidden');
    if ($('commit-msg') && !$('commit-msg').value) $('commit-msg').value = 'CMS: update member ' + state.id;
  }
  function applyGroupForm(j) {
    state.data = j;
    if (!state.data.attachments) state.data.attachments = [];
    $('ed-title').textContent = j.label || state.id;
    $('ed-path').textContent = state.path;
    $('g-goal').innerHTML = j.goalHtml || '<p></p>';
    $('g-what').innerHTML = j.whatHtml || '<p></p>';
    $('g-why').innerHTML = j.whyHtml || '<p></p>';
    $('g-how').innerHTML = j.howHtml || '<p></p>';
    $('g-result').innerHTML = j.resultHtml || '<p></p>';
    renderFileList(state.data.attachments);
    $('form-group').classList.remove('hidden');
    $('form-member').classList.add('hidden');
    if ($('commit-msg') && !$('commit-msg').value) $('commit-msg').value = 'CMS: update group ' + state.id;
  }

  function loadMember(id) {
    state.path = 'pages/members/' + id + '.html';
    var jsonPath = 'src/cms/pages/member/' + id + '.json';
    return API.loadJson(jsonPath).then(function (j) {
      applyMemberForm(j);
      setStatus('個人ページを読み込みました');
    }).catch(function (err) {
      setStatus('JSON未作成のため公開HTMLから読み込み中…');
      return API.loadText(state.path).then(function (html) {
        applyMemberForm(bootstrapMemberFromHtml(id, html));
        setStatus('公開HTMLから初期データを作成しました（初回保存でJSONが作られます）');
      }).catch(function (e2) {
        throw new Error('個人ページの読込に失敗: ' + (err && err.message ? err.message : err) + ' / HTML: ' + (e2 && e2.message ? e2.message : e2));
      });
    });
  }
  function loadGroup(id) {
    var g = C.groupByKey(id);
    if (!g) return Promise.reject(new Error('不明なグループ: ' + id));
    state.path = g.htmlPath;
    var jsonPath = 'src/cms/pages/group/' + id + '.json';
    return API.loadJson(jsonPath).then(function (j) {
      applyGroupForm(j);
      setStatus('グループページを読み込みました');
    }).catch(function (err) {
      setStatus('JSON未作成のため公開HTMLから読み込み中…');
      return API.loadText(state.path).then(function (html) {
        applyGroupForm(bootstrapGroupFromHtml(id, state.path, html));
        setStatus('公開HTMLから初期データを作成しました（初回保存でJSONが作られます）');
      }).catch(function (e2) {
        throw new Error('グループページの読込に失敗: ' + (err && err.message ? err.message : err) + ' / HTML: ' + (e2 && e2.message ? e2.message : e2));
      });
    });
  }

  function collectMember() {
    if (!San || !San.html) throw new Error('sanitize モジュール未読込');
    return {
      schemaVersion: 1, type: 'member', memberId: state.id,
      displayName: (state.data && state.data.displayName) || state.id,
      class: $('m-class').value, groupKey: $('m-group').value,
      favoriteColor: ($('m-color') && $('m-color').value.trim()) || '',
      favoriteColorHex: (function () {
        var hexEl = $('m-color-hex');
        var codeEl = $('m-color-code');
        var Color = window.ASOBI_COLOR;
        var fromPicker = hexEl ? hexEl.value : null;
        var fromCode = codeEl && codeEl.value.trim() ? codeEl.value.trim() : null;
        if (fromCode && Color && Color.resolve) return Color.resolve(fromCode) || fromPicker;
        if (fromCode && /^#/.test(fromCode)) return fromCode;
        var text = $('m-color') ? $('m-color').value.trim() : '';
        if (Color && Color.resolve) {
          var r = Color.resolve(text) || Color.resolve(fromPicker);
          if (r) return r;
        }
        return fromPicker || null;
      })(),
      hobbies: $('m-hobbies').value.trim(),
      hobbyTriggerHtml: San.html($('m-hobby-trigger').innerHTML),
      growthHtml: San.html($('m-growth').innerHTML),
      messageHtml: San.html($('m-message').innerHTML),
      htmlPath: state.path,
      updatedAt: new Date().toISOString(), updatedBy: state.user.id
    };
  }
  function collectGroup() {
    if (!San || !San.html) throw new Error('sanitize モジュール未読込');
    return {
      schemaVersion: 1, type: 'group', groupKey: state.id,
      label: (state.data && state.data.label) || state.id, htmlPath: state.path,
      goalHtml: San.html($('g-goal').innerHTML), whatHtml: San.html($('g-what').innerHTML),
      whyHtml: San.html($('g-why').innerHTML), howHtml: San.html($('g-how').innerHTML),
      resultHtml: San.html($('g-result').innerHTML),
      attachments: (state.data && state.data.attachments) ? state.data.attachments.slice() : [],
      updatedAt: new Date().toISOString(), updatedBy: state.user.id
    };
  }
  function uploadPendingIfAny() {
    var input = $('g-file');
    if (state.type !== 'group' || !input || !input.files || !input.files.length) return Promise.resolve();
    if (!Attach || !Attach.uploadGroupFiles) return Promise.reject(new Error('attachments モジュール未読込'));
    var mode = ($('g-file-mode') && $('g-file-mode').value) || 'link';
    setStatus('ファイルをアップロード中（' + input.files.length + '件）…');
    return Attach.uploadGroupFiles(state.id, input.files, mode).then(function (added) {
      if (!state.data) state.data = { attachments: [] };
      state.data.attachments = (state.data.attachments || []).concat(added);
      renderFileList(state.data.attachments);
      input.value = '';
      showPendingFiles();
    });
  }
  function onSave() {
    if (state.saving) return;
    var cm = ($('commit-msg') && $('commit-msg').value.trim()) || '';
    if (!cm) { setStatus('コミットメッセージを入力してください', true); if ($('commit-msg')) $('commit-msg').focus(); return; }
    if (!S.canEditPath(state.user, state.path) && !(state.user.isAdmin || state.user.fullAccess)) { setStatus('権限がありません', true); return; }
    if (!Render || !Render.member || !Render.group) { setStatus('render モジュール未読込', true); return; }
    if (!API || !API.saveText) { setStatus('api モジュール未読込', true); return; }
    state.saving = true;
    if ($('btn-save')) $('btn-save').disabled = true;
    showErr('');
    uploadPendingIfAny()
      .then(function () {
        var payload = state.type === 'member' ? collectMember() : collectGroup();
        state.data = payload;
        var jsonPath = state.type === 'member' ? 'src/cms/pages/member/' + state.id + '.json' : 'src/cms/pages/group/' + state.id + '.json';
        setStatus('JSON を保存中…');
        return API.saveText(jsonPath, JSON.stringify(payload, null, 2) + '\n', cm, true).then(function () {
          setStatus('公開HTMLを生成・保存中…');
          return API.loadText(state.path).then(function (baseHtml) {
            var html = state.type === 'member' ? Render.member(baseHtml, payload) : Render.group(baseHtml, payload, state.path);
            return API.saveText(state.path, html, cm, true);
          });
        });
      })
      .then(function () {
        setStatus('保存しました。公開ページ: ' + C.SITE + state.path);
        try { sessionStorage.removeItem('asobilab_cms_draft_' + state.type + '_' + state.id); } catch (e) {}
      })
      .catch(function (e) {
        var msg = e && e.message ? e.message : String(e);
        setStatus('保存失敗: ' + msg, true);
        showErr(msg);
      })
      .then(function () {
        state.saving = false;
        if ($('btn-save')) $('btn-save').disabled = false;
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    state.user = S.require(true);
    if (!state.user) return;
    if ($('user-pill')) $('user-pill').textContent = state.user.name || state.user.id;
    if ($('btn-logout')) $('btn-logout').onclick = function () { S.clear(); location.href = C.PAGES.login; };
    if ($('btn-back')) $('btn-back').onclick = function () { location.href = C.PAGES.select; };
    if ($('btn-save')) $('btn-save').onclick = onSave;
    document.querySelectorAll('[data-color-tab]').forEach(function (b) {
      b.addEventListener('click', function () { setColorTab(b.getAttribute('data-color-tab')); });
    });
    if ($('m-color-hex')) {
      $('m-color-hex').addEventListener('input', function () {
        if ($('m-color-code')) $('m-color-code').value = $('m-color-hex').value;
      });
    }
    if ($('m-color-code')) {
      $('m-color-code').addEventListener('change', function () {
        var Color = window.ASOBI_COLOR;
        var v = $('m-color-code').value.trim();
        var hex = Color && Color.resolve ? Color.resolve(v) : null;
        if (hex && $('m-color-hex')) $('m-color-hex').value = hex;
      });
    }
    if ($('g-file')) $('g-file').addEventListener('change', showPendingFiles);
    bindRtToolbars();
    state.type = qs('type');
    state.id = qs('id');
    if (!state.type || !state.id || (state.type !== 'member' && state.type !== 'group')) {
      showErr('不正なURLです。select から開き直してください。');
      setStatus('パラメータ不足', true);
      return;
    }
    if (!API || !API.loadJson) {
      showErr('api モジュールの読込に失敗しています。');
      setStatus('API未読込', true);
      return;
    }
    var loader = state.type === 'member' ? loadMember(state.id) : loadGroup(state.id);
    loader.then(function () {
      if (!S.canEditPath(state.user, state.path) && !(state.user.isAdmin || state.user.fullAccess)) {
        showErr('このページを編集する権限がありません');
        setStatus('権限がありません', true);
        if ($('btn-save')) $('btn-save').disabled = true;
      }
    }).catch(function (e) {
      showErr(e.message || String(e));
      setStatus('読込失敗', true);
    });
  });
})();
