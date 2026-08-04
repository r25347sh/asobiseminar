(function(){
'use strict';
if(window.__ASOBI_TERMINAL_BOOTED__)return;
var BASE=(function(){var s=document.querySelector('script[src*="terminal.js"]');return s?s.src.replace(/[^/]+$/,''):'/asobiseminar/terminal/';})();
var parts=[];
function go(i){
  if(i>=2){try{(0,eval)(parts.join(''));}catch(e){console.error('[AsobiTerminal]',e);}return;}
  fetch(BASE+'tpart'+i+'.js',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.text();})
    .then(function(t){parts.push(t);go(i+1);})
    .catch(function(e){
      console.error('[AsobiTerminal] load',e);
      var b=document.createElement('button');b.className='asobi-term-toggle';b.textContent='>_';
      b.style.cssText='position:fixed;bottom:18px;left:18px;z-index:2147483000;width:52px;height:52px;border:2px solid #00ff88;background:#0b0f0c;color:#00ff88;border-radius:14px;cursor:pointer;font:700 1.2rem monospace';
      b.onclick=function(){location.reload();};document.body.appendChild(b);
    });
}
go(0);
})();
