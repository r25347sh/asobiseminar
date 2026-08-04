(function(){
'use strict';
if(window.__ASOBI_TERMINAL_BOOTED__)return;
var BASE=(function(){var s=document.querySelector('script[src*="terminal.js"]');return s?s.src.replace(/[^/]+$/,'') : '/asobiseminar/terminal/';})();
var N=4, parts=[];
function go(i){
  if(i>=N){
    try{
      var bin=Uint8Array.from(atob(parts.join('')),function(c){return c.charCodeAt(0);});
      new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
        .then(function(code){(0,eval)(code);})
        .catch(function(e){console.error('[AsobiTerminal]',e);fb();});
    }catch(e){console.error('[AsobiTerminal]',e);fb();}
    return;
  }
  fetch(BASE+'tb'+i+'.txt',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.text();})
    .then(function(t){parts.push(t.trim());go(i+1);})
    .catch(function(e){console.error('[AsobiTerminal]',e);fb();});
}
function fb(){
  var b=document.createElement('button');b.className='asobi-term-toggle';b.textContent='>_';
  b.style.cssText='position:fixed;bottom:18px;left:18px;z-index:2147483000;width:52px;height:52px;border:2px solid #00ff88;background:#0b0f0c;color:#00ff88;border-radius:14px;cursor:pointer;font:700 1.2rem monospace';
  b.onclick=function(){location.reload();};document.body.appendChild(b);
}
go(0);
})();
