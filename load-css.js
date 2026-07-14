// load-css.js (すべてのCSSをここで一括管理)
const cssFiles = [
  '/asobiseminar/gaibu/unpkg.css',
  '/asobiseminar/variable.css?v=2',
  '/asobiseminar/style.css',
  '/asobiseminar/hamburgernav.css?v=2', // キャッシュ対策もバッチリ
];

cssFiles.reverse().forEach(url => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.prepend(link);
});
