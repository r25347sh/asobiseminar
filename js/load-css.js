// js/load-css.js - ページ別CSS + Navシステムの確実ロード
(function() {
  'use strict';

  const cssFiles = [
    '/asobiseminar/gaibu/unpkg.css',
    '/asobiseminar/css/style.css?v=2026',
    '/asobiseminar/nav/nav.css?v=2026'
  ];

  const currentPath = window.location.pathname;

  if (currentPath.includes('members.html')) {
    cssFiles.push('/asobiseminar/css/members.css?v=1');
  } else if (currentPath.includes('/groups/')) {
    cssFiles.push('/asobiseminar/css/groupsIndex.css?v=1');
  } else if (currentPath.includes('aboutsite.html')) {
    cssFiles.push('/asobiseminar/css/aboutsite.css?v=1');
  } else if (currentPath.includes('settings.html') || currentPath.includes('settigs.html')) {
    cssFiles.push('/asobiseminar/css/settings.css?v=1');
  } else if (currentPath.includes('programmer.html')) {
    cssFiles.push('/asobiseminar/css/programmer.css?v=2026');
  } else {
    cssFiles.push('/asobiseminar/css/index-main.css?v=1');
  }

  // CSSを逆順prependで優先度確保
  cssFiles.reverse().forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.prepend(link);
  });

  // Navシステムを**厳密な順序**でロード（Particle → Core）
  const navScripts = [
    '/asobiseminar/nav/nav-particle.js',
    '/asobiseminar/nav/nav-core.js'
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false; // 順序厳守
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  Promise.all(navScripts.map(loadScript))
    .then(() => {
      console.log('%c✅ Asobi Lab. Nav System Initialized', 'color:#00ff88;font-weight:bold');
    })
    .catch(err => {
      console.error('❌ Nav System Load Error:', err);
    });
})();
