// js/load-css.js - Ajax・GitHub Pages完全対応 + 遊び心エンジン
(function() {
  'use strict';

  const base = '/asobiseminar';
  const cacheBuster = 'v=' + new Date().getTime();

  // 1. 全ページ共通の基本CSS
  const baseCssFiles = [
    `${base}/gaibu/unpkg.css`,
    `${base}/css/style.css?${cacheBuster}`,
    `${base}/css/asobi-play.css?${cacheBuster}`,
    `${base}/MENU/MENU.css?${cacheBuster}`
  ];

  baseCssFiles.forEach(url => {
    if (document.querySelector(`link[href^="${url.split('?')[0]}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  });

  // 2. ページ別CSS
  const currentPath = window.location.pathname;
  let pageCssUrl = '';

  if (currentPath.includes('404') || (document.title && document.title.includes('404'))) {
    pageCssUrl = `${base}/css/404.css?${cacheBuster}`;
  } else if (currentPath.includes('members.html')) {
    pageCssUrl = `${base}/css/members.css?${cacheBuster}`;
  } else if (currentPath.includes('/groups/')) {
    if (currentPath.includes('one.html')) {
      pageCssUrl = `${base}/css/one.css?${cacheBuster}`;
    } else if (currentPath.includes('two.html')) {
      pageCssUrl = `${base}/css/two.css?${cacheBuster}`;
    } else if (currentPath.includes('three.html')) {
      pageCssUrl = `${base}/css/three.css?${cacheBuster}`;
    } else if (currentPath.includes('programmer.html') || currentPath.includes('englishgame.html')) {
      pageCssUrl = `${base}/css/programmer.css?${cacheBuster}`;
    } else {
      pageCssUrl = `${base}/css/groupsIndex.css?${cacheBuster}`;
    }
  } else if (currentPath.includes('aboutsite.html')) {
    pageCssUrl = `${base}/css/aboutsite.css?${cacheBuster}`;
  } else if (currentPath.includes('settings.html') || currentPath.includes('settigs.html')) {
    pageCssUrl = `${base}/css/settings.css?${cacheBuster}`;
  } else if (currentPath.includes('gallery.html')) {
    // gallery は共通 play + style で十分（専用CSSなし）
    pageCssUrl = '';
  } else if (currentPath.includes('programmer.html')) {
    pageCssUrl = `${base}/css/programmer.css?${cacheBuster}`;
  } else {
    pageCssUrl = `${base}/css/index-main.css?${cacheBuster}`;
  }

  if (pageCssUrl) {
    if (!document.querySelector(`link[href^="${pageCssUrl.split('?')[0]}"]`)) {
      const pageLink = document.createElement('link');
      pageLink.rel = 'stylesheet';
      pageLink.className = 'dynamic-page-css';
      pageLink.href = pageCssUrl;
      document.head.appendChild(pageLink);
    }
  }

  // 3. MENU JS
  const scriptUrl = `${base}/MENU/MENU.js?${cacheBuster}`;
  if (!document.querySelector(`script[src^="${base}/MENU/MENU.js"]`)) {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = false;
    document.head.appendChild(script);
  }

  // 4. 遊び心エンジン（全ページ）
  const playUrl = `${base}/js/asobi-play.js?${cacheBuster}`;
  if (!document.querySelector(`script[src^="${base}/js/asobi-play.js"]`)) {
    const playScript = document.createElement('script');
    playScript.src = playUrl;
    playScript.async = true;
    document.head.appendChild(playScript);
  }

  console.log('%c✅ Load-css + AsobiPlay for: ' + currentPath, 'color:#00ff88');
})();
