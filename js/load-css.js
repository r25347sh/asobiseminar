// js/load-css.js - GitHub Pages (リポジトリ名: asobiseminar) 最終版
(function() {
  'use strict';

  const base = '/asobiseminar';   // ← リポジトリ名固定

  const cssFiles = [
    `${base}/gaibu/unpkg.css`,
    `${base}/css/style.css?v=2026`,
    `${base}/nav/nav.css?v=2026`
  ];

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

  // Nav JS（Particle → Core の順序厳守）
  const navScripts = [
    `${base}/nav/nav-particle.js`,
    `${base}/nav/nav-core.js`
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => resolve(src);
      script.onerror = () => reject(new Error(`JS Load Failed: ${src}`));
      document.head.appendChild(script);
    });
  }

  Promise.all(navScripts.map(loadScript))
    .then(() => console.log('%c✅ NAV PARTICLE MENU READY', 'color:#00ff88;font-size:16px;font-weight:bold'))
    .catch(err => console.error('❌ NAV JS ERROR:', err));
})();
