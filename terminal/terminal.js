(function(){
'use strict';
if(window.__ASOBI_TERMINAL_BOOTED__)return;
var BASE=(function(){var s=document.querySelector('script[src*="terminal.js"]');return s?s.src.replace(/[^/]+$/,''):'/asobiseminar/terminal/';})();
var N=3;
var parts=[];
function go(i){
  if(i>=N){
    try{
      var u8=Uint8Array.from(atob(parts.join('')),function(c){return c.charCodeAt(0);});
      new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
        .then(function(code){(0,eval)(code);})
        .catch(function(e){console.error('[AsobiTerminal]',e);});
    }catch(e){console.error('[AsobiTerminal]',e);}
    return;
  }
  fetch(BASE+'t'+i+'.gz.b64').then(function(r){return r.text();}).then(function(t){parts.push(t.trim());go(i+1);})
    .catch(function(e){console.error('chunk',i,e);});
}
go(0);
})();
