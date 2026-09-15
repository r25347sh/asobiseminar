/*! Asobi CMS editor — form shell (save wire in Process D) */
(function () {
  var C = window.ASOBI_CMS;
  var S = window.ASOBI_SESSION;
  var API = window.ASOBI_API;
  var $ = function (id) { return document.getElementById(id); };
  var state = { user: null, type: null, id: null, path: null, data: null };

  function qs(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }

  function setStatus(t, isErr) {
    var el = $('save-status');
    if (!el) return;
    el.textContent = t || '';
    el.className = 'status-line' + (isErr ? ' err' : '');
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
      if (typeof o === 'string') {
        opt.value = o; opt.textContent = o;
      } else {
        opt.value = o.key; opt.textContent = o.label;
      }
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
          var cmd = btn.getAttribute('data-cmd');
          var val = btn.getAttribute('data-val') || null;
          try { document.execCommand(cmd, false, val); } catch (err) {}
        });
      });
    });
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
      setStatus('個人ページを読み込みました');
    });
  }

  function loadGroup(id) {
    var g = C.groupByKey(id);
    if (!g) return Promise.reject(new Error('不明なグループ: ' + id));
    state.path = g.htmlPath;
    return API.loadJson('src/cms/pages/group/' + id + '.json').then(function (j) {
      state.data = j;
      $('ed-title').textContent = j.label || g.label;
      $('ed-path').textContent = state.path;
      $('g-goal').innerHTML = j.goalHtml || '<p></p>';
      $('g-what').innerHTML = j.whatHtml || '<p></p>';
      $('g-why').innerHTML = j.whyHtml || '<p></p>';
      $('g-how').innerHTML = j.howHtml || '<p></p>';
      $('g-result').innerHTML = j.resultHtml || '<p></p>';
      var list = $('g-file-list');
      if (list) {
        list.innerHTML = '';
        (j.attachments || []).forEach(function (a) {
          var li = document.createElement('li');
          li.textContent = (a.name || a.path) + ' [' + (a.mode || 'link') + ']';
          list.appendChild(li);
        });
      }
      $('form-group').classList.remove('hidden');
      $('form-member').classList.add('hidden');
      setStatus('グループページを読み込みました');
    });
  }

  function collectMember() {
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
      hobbyTriggerHtml: $('m-hobby-trigger').innerHTML,
      growthHtml: $('m-growth').innerHTML,
      messageHtml: $('m-message').innerHTML,
      htmlPath: state.path,
      updatedAt: new Date().toISOString(),
      updatedBy: state.user.id
    };
  }

  function collectGroup() {
    return {
      schemaVersion: 1,
      type: 'group',
      groupKey: state.id,
      label: (state.data && state.data.label) || state.id,
      htmlPath: state.path,
      goalHtml: $('g-goal').innerHTML,
      whatHtml: $('g-what').innerHTML,
      whyHtml: $('g-why').innerHTML,
      howHtml: $('g-how').innerHTML,
      resultHtml: $('g-result').innerHTML,
      attachments: (state.data && state.data.attachments) || [],
      updatedAt: new Date().toISOString(),
      updatedBy: state.user.id
    };
  }

  function onSave() {
    var cm = ($('commit-msg') && $('commit-msg').value.trim()) || '';
    if (!cm) {
      setStatus('コミットメッセージを入力してください', true);
      if ($('commit-msg')) $('commit-msg').focus();
      return;
    }
    var payload = state.type === 'member' ? collectMember() : collectGroup();
    console.log('[CMS editor] save payload (Process D で put)', payload);
    setStatus('プレビュー保存: プロセスDで GitHub へ書き込み接続します。データはコンソールに出力しました。');
    try {
      sessionStorage.setItem('asobilab_cms_draft_' + state.type + '_' + state.id, JSON.stringify(payload));
    } catch (e) {}
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
    if ($('btn-back')) {
      $('btn-back').onclick = function () { location.href = C.PAGES.select; };
    }
    if ($('btn-save')) $('btn-save').onclick = onSave;
    if ($('m-color-hex')) {
      $('m-color-hex').addEventListener('input', function () {
        if ($('m-color') && !$('m-color').value) $('m-color').value = $('m-color-hex').value;
      });
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
        $('btn-save').disabled = true;
      }
    }).catch(function (e) {
      showErr(e.message || String(e));
      setStatus('読込失敗', true);
    });
  });
})();
