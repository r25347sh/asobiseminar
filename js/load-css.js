// js/load-css.js - GitHub Pages (asobiseminar) 完全対応版
(function() {
  'use strict';

  // リポジトリ名固定（asobiseminar）
  const base = '/asobiseminar';

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

  // CSSロード
  cssFiles.reverse().forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.prepend(link);
  });

  // Navシステム（順序厳守）
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
      script.onerror = () => reject(new Error(`Load failed: ${src}`));
      document.head.appendChild(script);
    });
  }

  Promise.all(navScripts.map(loadScript))
    .then(() => {
      console.log('%c✅ Asobi Lab. Nav System Ready (asobiseminar)', 'color:#00ff88; font-weight:bold; font-size:14px');
    })
    .catch(err => {
      console.error('❌ Nav Load Error:', err);
      console.log('Current base path:', base);
    });
})();
