// js/load-css.js
(function() {
  // --- 1. CSSファイルのリスト定義と条件分岐 ---
  const cssFiles = [
    '/asobiseminar/gaibu/unpkg.css',
    '/asobiseminar/css/style.css?v=2026',
    '/asobiseminar/nav/nav.css?v=2026'
  ];

  const currentPath = window.location.pathname;

  if (currentPath.includes('members.html')) {
    cssFiles.push('/asobiseminar/css/members.css?v=1');
  } 
  else if (currentPath.includes('/groups/')) {
    cssFiles.push('/asobiseminar/css/groupsIndex.css?v=1');
  } 
  else if (currentPath.includes('aboutsite.html')) {
    cssFiles.push('/asobiseminar/css/aboutsite.css?v=1');
  } 
  else if (currentPath.includes('settings.html') || currentPath.includes('settigs.html')) {
    cssFiles.push('/asobiseminar/css/settings.css?v=1');
  } 
  else if (currentPath.includes('programmer.html')) {
    cssFiles.push('/asobiseminar/css/programmer.css?v=2026');  // ★ 確実ロード
  } 
  else {
    cssFiles.push('/asobiseminar/css/index-main.css?v=1');
  }

  // --- 2. CSSファイルの読み込み実行（逆順・先頭追加） ---
  cssFiles.reverse().forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.prepend(link);
  });

  // --- 3. 追加：JSファイルの読み込み実行（正順・末尾追加） ---
  const jsFiles = [
    '/asobiseminar/nav/nav-core.js',
    '/asobiseminar/nav/nav-particle.js'
  ];

  jsFiles.forEach(url => {
    const script = document.createElement('script');
    script.src = url;
    script.defer = true; // HTMLパースを妨げず、配列の順序通りに実行する設定
    document.head.appendChild(script);
  });
})();
