(function(){
'use strict';
if(window.__ASOBI_TERMINAL_BOOTED__)return;
var BASE=(function(){var s=document.querySelector('script[src*="terminal.js"]');return s?s.src.replace(/[^/]+$/,''):'/asobiseminar/terminal/';})();
var N=3, parts=[];
function go(i){
  if(i>=N){
    try{(0,eval)(parts.join(''));}catch(e){console.error('[AsobiTerminal] eval failed',e);}
    return;
  }
  fetch(BASE+'term-part'+i+'.js',{cache:'no-store'}).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.text();
  }).then(function(t){parts.push(t);go(i+1);})
  .catch(function(e){
    console.error('[AsobiTerminal] chunk '+i,e);
    var btn=document.createElement('button');
    btn.textContent='>_';
    btn.title='Terminal load failed — click to retry';
    btn.className='asobi-term-toggle';
    btn.style.cssText='position:fixed;bottom:18px;left:18px;z-index:10000001;width:48px;height:48px;border-radius:12px;border:2px solid #00ff88;background:#0b0f0c;color:#00ff88;cursor:pointer;font:700 1.2rem monospace';
    btn.onclick=function(){location.reload();};
    document.body.appendChild(btn);
  });
}
go(0);
})();
