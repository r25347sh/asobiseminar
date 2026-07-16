// js/load-css.js - あなたのGitHub Pages完全対応版
(function() {
  'use strict';

  // GitHub Pages用（リポジトリ: asobiseminar）
  const base = '/asobiseminar';

  const cssFiles = [
    `${base}/gaibu/unpkg.css`,
    `${base}/css/style.css?v=2026`,
    `${base}/nav/nav.css?v=2026`
  ];

  // ページ別CSS
  const currentPath = window.location.pathname;
  if (currentPath.includes('members.html')) cssFiles.push(`${base}/css/members.css?v=1`);
  else if (currentPath.includes('/groups/')) cssFiles.push(`${base}/css/groupsIndex.css?v=1`);
  else if (currentPath.includes('aboutsite.html')) cssFiles.push(`${base}/css/aboutsite.css?v=1`);
  else if (currentPath.includes('settings.html') || currentPath.includes('settigs.html')) cssFiles.push(`${base}/css/settings.css?v=1`);
  else if (currentPath.includes('programmer.html')) cssFiles.push(`${base}/css/programmer.css?v=2026`);
  else cssFiles.push(`${base}/css/index-main.css?v=1`);

  cssFiles.reverse().forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.prepend(link);
  });

  // Nav JS 直接ロード
  const navScripts = [
    `${base}/nav/nav-particle.js`,
    `${base}/nav/nav-core.js`
  ];

  navScripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  });

  console.log('%c✅ Load-css executed with base: /asobiseminar', 'color:#00ff88');
})();
