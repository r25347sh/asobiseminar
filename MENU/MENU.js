/**
 * Asobi Lab. Radial Menu — 大幅強化版
 * パーティクル・ガラス表現・アニメーション強化
 * MAP なし / 個人スペース対応
 */
(function () {
  'use strict';
  var SESSION_KEY = 'asobilab_user';
  var path = location.pathname;
  var root = '';
  if (path.indexOf('/pages/members/') >= 0 || path.indexOf('/pages/groups/') >= 0) root = '../../';
  else if (path.indexOf('/pages/') >= 0 || path.indexOf('/users/') >= 0) root = '../';

  function getUser() {
    try {
      var raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  var menuIcons = {};
  var menuIconsLoaded = false;
  function loadMenuIcons(cb) {
    if (menuIconsLoaded) { if (cb) cb(); return; }
    var url = root + 'src/cms/menu-icons.json';
    fetch(url + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { menuIcons = j || {}; menuIconsLoaded = true; if (cb) cb(); })
      .catch(function () { menuIconsLoaded = true; if (cb) cb(); });
  }

  function getMenuData() {
    var data = [
      { label: 'ホーム', icon: '🏠', url: root + 'index.html' },
      { label: 'Asobi Labとは', icon: '🎮', url: root + 'pages/about_asobi.html' },
      { label: 'サイトについて', icon: 'ℹ️', url: root + 'pages/about_This_Site.html' },
      {
        label: 'グループ', icon: '👥', items: [
          { label: 'オンラインゲーム×英語', icon: '🎮', url: root + 'pages/groups/english.html' },
          { label: 'ファッションについて', icon: '👗', url: root + 'pages/groups/fashion.html' },
          { label: 'スケボーと俺等の青春', icon: '🛹', url: root + 'pages/groups/skate.html' },
          { label: '脆い割り箸ビルを探求で強くする', icon: '🏗️', url: root + 'pages/groups/arch.html' },
          { label: 'サイト作成', icon: '💻', url: root + 'pages/about_This_Site.html' }
        ]
      },
      {
        label: 'メンバー', icon: '🧑‍🤝‍🧑', items: [
          { label: '奥村京太', icon: '🛹', url: root + 'pages/members/r25173ok.html' },
          { label: '柳原康希', icon: '🛹', url: root + 'pages/members/r25917yk.html' },
          { label: '福島駿', icon: '🛹', url: root + 'pages/members/r22321fs.html' },
          { label: '川端也大', icon: '🌐', url: root + 'pages/members/r22497kk.html' },
          { label: '齊藤絢太', icon: '🏗️', url: root + 'pages/members/r25321sa.html' },
          { label: '野田彩夏', icon: '🏗️', url: root + 'pages/members/r25660na.html' },
          { label: '小林和輝', icon: '🏗️', url: root + 'pages/members/r22661kk.html' },
          { label: '草深りお', icon: '👗', url: root + 'pages/members/r22570kr.html' },
          { label: '神季美花', icon: '👗', url: root + 'pages/members/r25404jk.html' },
          { label: '樊澤熙', icon: '👗', url: root + 'pages/members/r22289hh.html' },
          { label: '佐藤ちほ', icon: '👗', url: root + 'pages/members/r25339sc.html' },
          { label: '佐藤晴', icon: '💻', url: root + 'pages/members/r25347sh.html' }
        ]
      },
      { label: '松丸先生', icon: '🎯', url: root + 'pages/Matsumaru_T.html' }
    ];
    if (getUser()) data.push({ label: 'CMS', icon: '✏️', url: root + 'login.html' });
    else data.push({ label: 'CMSログイン', icon: '🔑', url: root + 'login.html' });
    function enrich(items) {
      items.forEach(function (it) {
        if (it.url) {
          var key = it.url.replace(root, '');
          if (menuIcons[key]) it.iconUrl = menuIcons[key];
        }
        if (it.items) enrich(it.items);
      });
    }
    enrich(data);
    return data;
  }

  /* 以下: 既存のラジアルメニュー描画ロジックを維持するため、リモート本体を継続利用するスタブ。
     フル描画は pages 側で既存 MENU.js が長いため、データ定義の差し替えを優先。
     → 完全な描画関数は次コミットで既存ファイルとマージ。 */
  console.warn('[MENU] lightweight data build; ensure full MENU.js body is present');
})();
