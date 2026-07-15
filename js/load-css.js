// js/load-css.js
(function() {
  // 1. 全ページで100%絶対に使う「共通の土台CSS」
  const cssFiles = [
    '/asobiseminar/gaibu/unpkg.css',
    '/asobiseminar/css/style.css?v=2026'
  ];

  // 2. ブラウザの現在のURLをチェックして、専用CSSを自動追加
  const currentPath = window.location.pathname;

  if (currentPath.includes('members.html')) {
    cssFiles.push('/asobiseminar/css/members.css?v=1');
  } 
  else if (currentPath.includes('groups/')) {
    cssFiles.push('/asobiseminar/css/groupsIndex.css?v=1');
  } 
  else if (currentPath.includes('aboutsite.html')) {
    cssFiles.push('/asobiseminar/css/aboutsite.css?v=1');
  } 
  else if (currentPath.includes('settings.html') || currentPath.includes('settigs.html')) {
    cssFiles.push('/asobiseminar/css/settings.css?v=1');
  } 
  else if (currentPath.includes('programmer.html')) {
    // ★ 新規追加：マークアッププログラマー専用CSS
    cssFiles.push('/asobiseminar/css/programmer.css?v=1');
  } 
  else {
    // トップページなど
    cssFiles.push('/asobiseminar/css/index-main.css?v=1');
  }

  // 3. すべてのCSSを逆順で読み込み（専用CSSが優先）
  cssFiles.reverse().forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.prepend(link);
  });
})();
