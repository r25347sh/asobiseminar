(function(){
'use strict';
if(window.__ASOBI_PLAY_BOOTED__)return;
window.__ASOBI_PLAY_BOOTED__=true;
var BASE=(function(){var s=document.querySelector('script[src*="asobi-play.js"]');return s?s.src.replace(/[^/]+$/,''):'/asobiseminar/js/';})();
var N=2,parts=[];
function go(i){
  if(i>=N){try{(0,eval)(parts.join(''));}catch(e){console.error('[AsobiPlay]',e);}return;}
  fetch(BASE+'play-part'+i+'.js',{cache:'no-store'}).then(function(r){return r.text();})
    .then(function(t){parts.push(t);go(i+1);})
    .catch(function(e){console.error('[AsobiPlay] chunk',i,e);});
}
go(0);
})();
