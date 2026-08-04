// js/load-css.js - 全ページ + 遊び心 + ファビコン自動注入
(function() {
  'use strict';

  const base = '/asobiseminar';
  const cacheBuster = 'v=' + new Date().getTime();

  // ----- Favicon (完全ラスター化 PNG/ICO + apple-touch) 全ページ自動 -----
  function injectFavicons() {
    if (document.querySelector('link[data-asobi-favicon]')) return;

    const pngHref = base + '/favicon.png?' + cacheBuster;
    const icoHref = base + '/favicon.ico?' + cacheBuster;
    const appleHref = base + '/apple-touch-icon.png?' + cacheBuster;

    // 標準 PNG favicon
    const iconPng = document.createElement('link');
    iconPng.rel = 'icon';
    iconPng.type = 'image/png';
    iconPng.sizes = '512x512';
    iconPng.href = pngHref;
    iconPng.setAttribute('data-asobi-favicon', '1');
    document.head.appendChild(iconPng);

    // ICO (旧ブラウザ・タブ互換)
    const iconIco = document.createElement('link');
    iconIco.rel = 'icon';
    iconIco.type = 'image/x-icon';
    iconIco.href = icoHref;
    iconIco.setAttribute('data-asobi-favicon', '1');
    document.head.appendChild(iconIco);

    // shortcut icon
    const shortcut = document.createElement('link');
    shortcut.rel = 'shortcut icon';
    shortcut.href = icoHref;
    shortcut.setAttribute('data-asobi-favicon', '1');
    document.head.appendChild(shortcut);

    // Apple Touch Icon
    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.sizes = '180x180';
    apple.href = appleHref;
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

  console.log('%c✅ AsobiPlay + Favicon (raster) for: ' + currentPath, 'color:#00ff88');
})();
