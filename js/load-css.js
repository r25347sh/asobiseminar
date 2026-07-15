// js/load-css.js
(function() {
  const cssFiles = [
    '/asobiseminar/gaibu/unpkg.css',
    '/asobiseminar/css/style.css?v=2026'
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

  // 逆順で優先順位を確保
  cssFiles.reverse().forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.prepend(link);
  });
})();
