// js/load-css.js
(function() {
  // 1. 全ページで100%絶対に使う「共通の土台CSS」のタスク
  const cssFiles = [
    '/asobiseminar/gaibu/unpkg.css',
    '/asobiseminar/css/style.css?v=2026'
  ];

  // 2. ブラウザの現在のURLをチェックして、そのページ専用のCSSを自動で追加するタスク
  const currentPath = window.location.pathname;
  if (currentPath.includes('members.html')) {
    cssFiles.push('/asobiseminar/css/members.css?v=1');
  } 
  else if (currentPath.includes('groups/')) {
    cssFiles.push('/asobiseminar/css/groups.css?v=1');
  } 
  else if (currentPath.includes('aboutsite.html')) {
    cssFiles.push('/asobiseminar/css/aboutsite.css?v=1');
  } 
  else if (currentPath.includes('settings.html')) {
    cssFiles.push('/asobiseminar/css/settings.css?v=1');
  } 
  else {
    // どれにも当てはまらない場合（トップページ index.html など）
    cssFiles.push('/asobiseminar/css/index-main.css?v=1');
  }

  // 3. すべてのCSSを逆順にして、正しい優先順位（専用CSSが一番下）で一瞬で並列ダウンロード！
  cssFiles.reverse().forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.prepend(link);
  });
})();
