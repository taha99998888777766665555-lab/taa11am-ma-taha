const L=require('/tmp/v61/t/lib.js');const fs=require('fs');const {execSync}=require('child_process');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
(async()=>{
 const {br,p,errs}=await L.mk('board',{sw:true});
 await p.addInitScript(()=>{window.__au=[];const OA=window.Audio;window.Audio=function(s){const a=new OA(s);const r={src:String(s),ev:[]};['error','ended','playing'].forEach(e=>a.addEventListener(e,()=>r.ev.push(e)));window.__au.push(r);return a};window.Audio.prototype=OA.prototype;});
 await p.goto('http://127.0.0.1:8962/index.html');await p.waitForTimeout(3500);
 await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(3500);
 const c=await p.evaluate(async()=>{const ks=await caches.keys();const out={};for(const k of ks){const c=await caches.open(k);const r=await c.keys();out[k]=r.map(x=>x.url.replace(location.origin,''))}return out});
 const k=Object.keys(c); ok(k.length===1&&k[0]==='taha-app-v40','only v40 cache',k.join());
 const u=c['taha-app-v40']||[];
 ['/wbk2.js','/wbk2-data.js','/wbk2.css','/assets/fonts/readex-pro/readex-pro-arabic-400-normal.woff2','/assets/fonts/readex-pro/readex-pro-arabic-600-normal.woff2'].forEach(f=>ok(u.includes(f),'cached '+f));
 const syl=u.filter(x=>x.includes('/syllables/'));
 ok(syl.length===7,'7 approved syllable files cached, got '+syl.length,syl.join());
 ok(!syl.some(x=>/wbk2_|l2_(01|05|06|08|10|11)\.mp3/.test(x)),'no rejected/unapproved cached');
 ok(u.filter(x=>/\.mp3/.test(x)).length===38,'38 mp3 total (31+7), got '+u.filter(x=>/\.mp3/.test(x)).length);
 await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(200);
 await p.click('#wbk2Entry');await p.waitForTimeout(500);
 execSync('fuser -k 8962/tcp || true');await p.waitForTimeout(800);
 let loaded=true;try{await p.reload({timeout:15000});await p.waitForTimeout(3000)}catch(e){loaded=false}
 ok(loaded,'offline reload');
 await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(200);
 ok(await p.evaluate(()=>document.getElementById('wbk2Entry').offsetParent!==null),'entry visible offline');
 await p.click('#wbk2Entry');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.getElementById('wbkL2').classList.contains('active')&&!!document.querySelector('#wb2Path .wb2-stepbtn')),'lesson 2 opens offline');
 ok(await p.evaluate(async()=>{await document.fonts.load('600 40px "Readex Pro"','قَرَ');return document.fonts.check('600 40px "Readex Pro"','قَرَ')}),'local font loaded offline');
 await p.evaluate(()=>wbk2State.scope='all'); await p.evaluate(()=>{window.__au.length=0});
 // play every approved syllable via hear until all 7 heard
 const appr=await p.evaluate(()=>WBK2_DATA.SYLLABLES.filter(s=>s.approved).map(s=>s.audio));
 for(let r=0;r<4;r++){ await p.evaluate(()=>wbk2Internals.renderHome()); await p.click('[data-stage=hear]');
   for(let i=0;i<6;i++){await p.waitForTimeout(1300);const it=await p.evaluate(()=>{const R=wbk2State.run;return R.items[R.i]});await p.click(`#wb2Opts [data-id=${it.id}]`);await p.waitForTimeout(300);const nx=await p.$('#wb2QActs .main');if(nx)await nx.click().catch(()=>{});}
 }
 const au=await p.evaluate(()=>window.__au.filter(a=>a.src.includes('/syllables/')));
 const heard=new Set(au.filter(a=>a.ev.includes('ended')).map(a=>a.src));
 ok(au.every(a=>!a.ev.includes('error')),'no audio errors offline',JSON.stringify(au.filter(a=>a.ev.includes('error'))));
 ok(heard.size>=5,'approved syllables play offline (distinct ended: '+heard.size+')');
 ok(au.every(a=>appr.includes(a.src)),'only approved');
 const sv=await p.evaluate(()=>wbk2Internals.load().stars); ok(sv>=1,'progress saved offline '+sv);
 console.log('errs',errs);ok(errs.length===0,'no js errors');
 console.log('PASS',pass,'FAIL',fail);await br.close();
})();
