// load-css.js (すべてのCSSをここで一括管理)
const cssFiles = [
  '/asobiseminar/style.css',
  '/asobiseminar/hamburger.css?v=2', // キャッシュ対策もバッチリ
];

// ループ処理でHTMLの<head>の中に<link>タグを同時にぶち込む
cssFiles.forEach(url => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link); // 並行して一瞬でダウンロードが始まる
});
