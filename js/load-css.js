// js/load-css.js - 全ページ + 遊び心 + ファビコン + Terminal 自動注入
(function() {
  'use strict';

  const base = '/asobiseminar';
  const cacheBuster = 'v=' + new Date().getTime();

  // ----- Favicon (完全ラスター化済み SVG) 全ページ自動 -----
  function injectFavicons() {
    if (document.querySelector('link[data-asobi-favicon]')) return;

    const svgHref = base + '/favicon.svg?' + cacheBuster;

    const iconSvg = document.createElement('link');
    iconSvg.rel = 'icon';
    iconSvg.type = 'image/svg+xml';
    iconSvg.href = svgHref;
    iconSvg.setAttribute('data-asobi-favicon', '1');
    document.head.appendChild(iconSvg);

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
    `${base}/MENU/MENU.css?${cacheBuster}`,
    `${base}/terminal/terminal.css?${cacheBuster}`
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

  function injectScript(srcBase) {
    if (document.querySelector(`script[src^="${srcBase}"]`)) return;
    const script = document.createElement('script');
    script.src = `${srcBase}?${cacheBuster}`;
    script.async = false;
    document.head.appendChild(script);
  }

  injectScript(`${base}/MENU/MENU.js`);
  injectScript(`${base}/js/asobi-play.js`);
  injectScript(`${base}/terminal/terminal.js`);

  console.log('%c✅ AsobiPlay + Terminal + Favicon for: ' + currentPath, 'color:#00ff88');
})();
