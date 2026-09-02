(function () {
  'use strict';
  var OWNER = 'r25347sh';
  var REPO = 'asobiseminar';
  var BACKUP_REPO = 'asobiseminar_backup';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents';
  var BACKUP_API = 'https://api.github.com/repos/' + OWNER + '/' + BACKUP_REPO + '/contents';
  var SITE = 'https://r25347sh.github.io/asobiseminar/';
  var SESSION = 'asobilab_user';
  var TOKEN = 'github_pat_11BXRNCFA0z6wQzD7P0p1A_' +
              'IRz7ii32tqH2LsbYQWCyp1YHSn' +
              'CXgrIDZr56epqgIkXZBW6YUHVK3v9kVPY';

  var USERS = {};
  var state = {
    user: null, path: null, mode: 'visual', selected: null,
    isHtml: true, originalHtml: null, fileSha: null,
    drag: null, resize: null, draftTimer: null,
    pageStyles: {},
    pageKeyframes: {},
    undoStack: [],
    redoStack: [],
    undoLock: false,
    chromeLayer: null,
    chromeRaf: null
  };

  // NOTE: This is a truncated example; full content must be used.
  console.error('INCOMPLETE - do not use');
})();
