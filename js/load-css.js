// js/load-css.js - Ajax・GitHub Pages完全対応決定版
(function() {
  'use strict';

  const base = '/asobiseminar';
  // キャッシュを強制突破するためのランダムな数字を自動生成
  const cacheBuster = 'v=' + new Date().getTime();

  // 1. 全ページ共通の基本CSS
  const baseCssFiles = [
    `${base}/gaibu/unpkg.css`,
    `${base}/css/style.css?${cacheBuster}`,
    `${base}/nav/nav.css?${cacheBuster}`,
    `${base}/MENU/MENU.css?${cacheBuster}`
  ];

  baseCssFiles.forEach(url => {
    // 既に同じ共通CSSが入っていればスキップ（二重読み込み防止）
    if (document.querySelector(`link[href^="${url.split('?')[0]}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link); // 確実に効かせるため後ろに追加
  });

  // 2. ページ別CSSの判定と追加
  const currentPath = window.location.pathname;
  let pageCssUrl = '';

  if (currentPath.includes('members.html')) {
    pageCssUrl = `${base}/css/members.css?${cacheBuster}`;
  } else if (currentPath.includes('/groups/')) {
    pageCssUrl = `${base}/css/groupsIndex.css?${cacheBuster}`;
  } else if (currentPath.includes('aboutsite.html')) {
    pageCssUrl = `${base}/css/aboutsite.css?${cacheBuster}`;
  } else if (currentPath.includes('settings.html') || currentPath.includes('settigs.html')) {
    pageCssUrl = `${base}/css/settings.css?${cacheBuster}`;
  } else if (currentPath.includes('programmer.html')) {
    pageCssUrl = `${base}/css/programmer.css?${cacheBuster}`;
  } else {
    pageCssUrl = `${base}/css/index-main.css?${cacheBuster}`;
  }

  if (pageCssUrl) {
    const pageLink = document.createElement('link');
    pageLink.rel = 'stylesheet';
    pageLink.className = 'dynamic-page-css'; // ラジアルメニュー側から消去・制御できるようにクラスを付与
    pageLink.href = pageCssUrl;
    document.head.appendChild(pageLink); // 最も優先されるよう、headの一番下に差し込む
  }

  // 3. Nav JS のロード（重複を防ぐ）
  const scriptUrl = `${base}/MENU/MENU.js?${cacheBuster}`;
  if (!document.querySelector(`script[src^="${base}/MENU/MENU.js"]`)) {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = false;
    document.head.appendChild(script);
  }

  console.log('%c✅ Load-css re-executed for path: ' + currentPath, 'color:#00ff88');
})();
