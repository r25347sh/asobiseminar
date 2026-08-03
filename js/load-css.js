// js/load-css.js - 全ページ + 遊び心 + ファビコン自動注入
(function() {
  'use strict';

  const base = '/asobiseminar';
  const cacheBuster = 'v=' + new Date().getTime();

  // ----- Favicon (高解像度 SVG + フォールバック) 全ページ自動 ----- 
  function injectFavicons() {
    if (document.querySelector('link[data-asobi-favicon]')) return;

    const svgHref = base + '/favicon.svg?' + cacheBuster;

    const iconSvg = document.createElement('link');
    iconSvg.rel = 'icon';
    iconSvg.type = 'image/svg+xml';
    iconSvg.href = svgHref;
    iconSvg.setAttribute('data-asobi-favicon', '1');
    document.head.appendChild(iconSvg);

    // 旧ブラウザ向けに同じSVGを shortcut icon としても
    const shortcut = document.createElement('link');
    shortcut.rel = 'shortcut icon';
    shortcut.href = svgHref;
    shortcut.setAttribute('data-asobi-favicon', '1');
    document.head.appendChild(shortcut);

    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = svgHref;
    apple.setAttribute('data-asobi-favicon', '1');
    document.head.appendChild(apple);

    // theme-color もテーマに寄せる（可能なら）
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = getComputedStyle(document.documentElement).getPropertyValue('--main-color').trim() || '#00ff88';
      document.head.appendChild(meta);
    }
  }

  injectFavicons();

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

  const currentPath = window.location.pathname;
  let pageCssUrl = '';

  if (currentPath.includes('404') || (document.title && document.title.includes('404'))) {
    pageCssUrl = `${base}/css/404.css?${cacheBuster}`;
  } else if (currentPath.includes('playground.html')) {
    pageCssUrl = `${base}/css/playground.css?${cacheBuster}`;
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

  const scriptUrl = `${base}/MENU/MENU.js?${cacheBuster}`;
  if (!document.querySelector(`script[src^="${base}/MENU/MENU.js"]`)) {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = false;
    document.head.appendChild(script);
  }

  const playUrl = `${base}/js/asobi-play.js?${cacheBuster}`;
  if (!document.querySelector(`script[src^="${base}/js/asobi-play.js"]`)) {
    const playScript = document.createElement('script');
    playScript.src = playUrl;
    playScript.async = true;
    document.head.appendChild(playScript);
  }

  console.log('%c✅ AsobiPlay + Favicon for: ' + currentPath, 'color:#00ff88');
})();
