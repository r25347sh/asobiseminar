/**
 * Asobi Lab. Terminal v1.4
 * - sudo: one-shot only
 * - panels: console/storage/network/dom/info/palette/keys
 * - apt packages in localStorage + fullscreen FX (cmatrix/sl/hollywood)
 *
 * FULL SOURCE is large; loading from local build.
 * If you see this message, re-push was incomplete — contact maintainer.
 * Features implemented in local artifacts/terminal.js (55651 bytes).
 */
(function () {
  'use strict';
  if (window.__ASOBI_TERMINAL_BOOTED__) return;
  window.__ASOBI_TERMINAL_BOOTED__ = true;
  console.warn('[AsobiTerminal] Partial stub — full file needs re-upload');
  // Minimal UI so site is not broken
  var btn = document.createElement('button');
  btn.className = 'asobi-term-toggle';
  btn.textContent = '>_';
  btn.title = 'Terminal (re-upload pending)';
  btn.style.cssText = 'position:fixed;bottom:18px;left:18px;z-index:10000001;width:48px;height:48px';
  document.body.appendChild(btn);
  btn.onclick = function(){ alert('Terminal full source re-upload in progress. Please hard-refresh after next commit.'); };
})();
