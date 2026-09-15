/*! Asobi CMS config */
(function (g) {
  var GROUPS = [
    { key: 'english', label: 'オンラインゲームを通じた英語学習の可能性', htmlPath: 'pages/groups/english.html' },
    { key: 'fashion', label: 'ファッションについて', htmlPath: 'pages/groups/fashion.html' },
    { key: 'skate', label: 'スケボーの技術向上とそのための思考', htmlPath: 'pages/groups/skate.html' },
    { key: 'arch', label: '脆い割り箸ビルを探求で強くする', htmlPath: 'pages/groups/arch.html' },
    { key: 'site', label: 'サイト作成', htmlPath: 'pages/about_This_Site.html' }
  ];
  var CLASSES = ['5A', '5B', '5C', '5D', '5E', '5F', '5G', '5H'];
  g.ASOBI_CMS = {
    OWNER: 'r25347sh',
    REPO: 'asobiseminar',
    BACKUP_REPO: 'asobiseminar_backup',
    SESSION_KEY: 'asobilab_cms_user',
    LEGACY_SESSION_KEY: 'asobilab_user',
    SITE: 'https://r25347sh.github.io/asobiseminar/',
    RAW: 'https://raw.githubusercontent.com/r25347sh/asobiseminar/main/',
    API: 'https://api.github.com/repos/r25347sh/asobiseminar/contents',
    BACKUP_API: 'https://api.github.com/repos/r25347sh/asobiseminar_backup/contents',
    USERS_URL: 'https://raw.githubusercontent.com/r25347sh/asobiseminar/main/src/users.json',
    PAGES: { login: 'login.html', select: 'select.html', editor: 'editor.html' },
    GROUPS: GROUPS,
    CLASSES: CLASSES,
    groupByKey: function (k) {
      for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].key === k) return GROUPS[i];
      return null;
    },
    groupByPath: function (path) {
      for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].htmlPath === path) return GROUPS[i];
      return null;
    }
  };
})(typeof window !== 'undefined' ? window : this);
