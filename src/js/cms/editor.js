/*! Asobi CMS editor — Process D full save */
(function () {
  var C = window.ASOBI_CMS;
  var S = window.ASOBI_SESSION;
  var API = window.ASOBI_API;
  var San = window.ASOBI_SANITIZE;
  var Render = window.ASOBI_RENDER;
  var Attach = window.ASOBI_ATTACH;
  var $ = function (id) { return document.getElementById(id); };
  var state = { user: null, type: null, id: null, path: null, data: null, saving: false };

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
  function loadMember(id) {
    state.path = 'pages/members/' + id + '.html';
    return API.loadJson('src/cms/pages/member/' + id + '.json').then(function (j) {
      state.data = j;
      $('ed-title').textContent = j.displayName || id;
      $('ed-path').textContent = state.path;
      fillSelect($('m-class'), C.CLASSES, j.class);
      fillSelect($('m-group'), C.GROUPS, j.groupKey);
      $('m-color').value = j.favoriteColor || '';
      if (j.favoriteColorHex) $('m-color-hex').value = j.favoriteColorHex;
      $('m-hobbies').value = j.hobbies || '';
      $('m-hobby-trigger').innerHTML = j.hobbyTriggerHtml || '<p></p>';
      $('m-growth').innerHTML = j.growthHtml || '<p></p>';
      $('m-message').innerHTML = j.messageHtml || '<p></p>';
      $('form-member').classList.remove('hidden');
      $('form-group').classList.add('hidden');
      if ($('commit-msg') && !$('commit-msg').value) {
        $('commit-msg').value = 'CMS: update member ' + id;
      }
      setStatus('個人ページを読み込みました');
    });
  }
  function loadGroup(id) {
    var g = C.groupByKey(id);
    if (!g) return Promise.reject(new Error('不明なグループ: ' + id));
    state.path = g.htmlPath;
    return API.loadJson('src/cms/pages/group/' + id + '.json').then(function (j) {
      state.data = j;
      if (!state.data.attachments) state.data.attachments = [];
      $('ed-title').textContent = j.label || g.label;
      $('ed-path').textContent = state.path;
      $('g-goal').innerHTML = j.goalHtml || '<p></p>';
      $('g-what').innerHTML = j.whatHtml || '<p></p>';
      $('g-why').innerHTML = j.whyHtml || '<p></p>';
      $('g-how').innerHTML = j.howHtml || '<p></p>';
      $('g-result').innerHTML = j.resultHtml || '<p></p>';
      renderFileList(state.data.attachments);
      $('form-group').classList.remove('hidden');
      $('form-member').classList.add('hidden');
      if ($('commit-msg') && !$('commit-msg').value) {
        $('commit-msg').value = 'CMS: update group ' + id;
      }
      setStatus('グループページを読み込みました');
    });
  }
  function collectMember() {
    if (!San || !San.html) throw new Error('sanitize モジュール未読込');
    return {
      schemaVersion: 1,
      type: 'member',
      memberId: state.id,
      displayName: (state.data && state.data.displayName) || state.id,
      class: $('m-class').value,
      groupKey: $('m-group').value,
      favoriteColor: $('m-color').value.trim(),
      favoriteColorHex: $('m-color-hex').value || null,
      hobbies: $('m-hobbies').value.trim(),
      hobbyTriggerHtml: San.html($('m-hobby-trigger').innerHTML),
      growthHtml: San.html($('m-growth').innerHTML),
      messageHtml: San.html($('m-message').innerHTML),
      htmlPath: state.path,
      updatedAt: new Date().toISOString(),
      updatedBy: state.user.id
    };
  }
  function collectGroup() {
    if (!San || !San.html) throw new Error('sanitize モジュール未読込');
    return {
      schemaVersion: 1,
      type: 'group',
      groupKey: state.id,
      label: (state.data && state.data.label) || state.id,
      htmlPath: state.path,
      goalHtml: San.html($('g-goal').innerHTML),
      whatHtml: San.html($('g-what').innerHTML),
      whyHtml: San.html($('g-why').innerHTML),
      howHtml: San.html($('g-how').innerHTML),
      resultHtml: San.html($('g-result').innerHTML),
      attachments: (state.data && state.data.attachments) ? state.data.attachments.slice() : [],
      updatedAt: new Date().toISOString(),
      updatedBy: state.user.id
    };
  }
  function uploadPendingIfAny() {
    var input = $('g-file');
    if (state.type !== 'group' || !input || !input.files || !input.files.length) {
      return Promise.resolve();
    }
    if (!Attach || !Attach.uploadGroupFiles) {
      return Promise.reject(new Error('attachments モジュール未読込'));
    }
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
    if (!cm) {
      setStatus('コミットメッセージを入力してください', true);
      if ($('commit-msg')) $('commit-msg').focus();
      return;
    }
    if (!S.canEditPath(state.user, state.path) && !(state.user.isAdmin || state.user.fullAccess)) {
      setStatus('権限がありません', true);
      return;
    }
    if (!Render || !Render.member || !Render.group) {
      setStatus('render モジュール未読込', true);
      return;
    }
    if (!API || !API.saveText) {
      setStatus('api モジュール未読込', true);
      return;
    }
    state.saving = true;
    if ($('btn-save')) $('btn-save').disabled = true;
    showErr('');
    uploadPendingIfAny()
      .then(function () {
        var payload = state.type === 'member' ? collectMember() : collectGroup();
        state.data = payload;
        var jsonPath = state.type === 'member'
          ? 'src/cms/pages/member/' + state.id + '.json'
          : 'src/cms/pages/group/' + state.id + '.json';
        setStatus('JSON を保存中…');
        return API.saveText(jsonPath, JSON.stringify(payload, null, 2) + '\n', cm, true).then(function () {
          setStatus('公開HTMLを生成・保存中…');
          return API.loadText(state.path).then(function (baseHtml) {
            var html = state.type === 'member'
              ? Render.member(baseHtml, payload)
              : Render.group(baseHtml, payload, state.path);
            return API.saveText(state.path, html, cm, true);
          });
        });
      })
      .then(function () {
        var pub = C.SITE + state.path;
        setStatus('保存しました。公開ページ: ' + pub);
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
    if ($('btn-logout')) {
      $('btn-logout').onclick = function () {
        S.clear();
        location.href = C.PAGES.login;
      };
    }
    if ($('btn-back')) $('btn-back').onclick = function () { location.href = C.PAGES.select; };
    if ($('btn-save')) $('btn-save').onclick = onSave;
    if ($('m-color-hex')) {
      $('m-color-hex').addEventListener('input', function () {
        if ($('m-color') && !$('m-color').value) $('m-color').value = $('m-color-hex').value;
      });
    }
    if ($('g-file')) {
      $('g-file').addEventListener('change', showPendingFiles);
    }
    bindRtToolbars();
    state.type = qs('type');
    state.id = qs('id');
    if (!state.type || !state.id || (state.type !== 'member' && state.type !== 'group')) {
      showErr('不正なURLです。select から開き直してください。');
      setStatus('パラメータ不足', true);
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
