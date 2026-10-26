const L=require('./lib.js');const {execSync}=require('child_process');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
(async()=>{
 // ---- isolation ----
 let {br,p,errs}=await L.mk('board');await L.open(p);
 const r=await p.evaluate(()=>{const I=wbk3Internals;const o={};
  o.a=StudentStore.currentId();
  const q=I.load();I.applyRead(q,'w06','ok');I.save(q);
  localStorage.setItem('taha_wbk2_progress_v1',JSON.stringify({marker:'L2-A'}));
  const f=document.createElement('iframe');f.src='about:blank';document.body.appendChild(f);const rl=f.contentWindow.localStorage;o.keys=[];for(let i=0;i<rl.length;i++){const k=rl.key(i);if(k.indexOf('wbk3')>=0)o.keys.push(k)}f.remove();
  o.b=StudentStore.add('طالب ب');return o});
 console.log('  keys:',r.keys.join());
 ok(r.keys.some(k=>k.indexOf('taha_s_'+r.a+'__taha_wbk3_progress_v1')===0),'lesson-3 progress stored under the student prefix');
 await p.evaluate(b=>StudentStore.switchTo(b),r.b);await p.waitForTimeout(1500);
 await p.evaluate(()=>{showScreen('words')});
 const rb=await p.evaluate(()=>{const I=wbk3Internals;const q=I.load();const o={cur:StudentStore.currentId(),stars:q.stars,n:Object.keys(q.starred).length,l2:localStorage.getItem('taha_wbk2_progress_v1')};I.applyRead(q,'w09','ok');I.save(q);return o});
 ok(rb.cur===r.b&&rb.stars===0&&rb.n===0,'new student starts clean');
 ok(rb.l2===null,'new student lesson-2 data empty');
 await p.evaluate(a=>StudentStore.switchTo(a),r.a);await p.waitForTimeout(1500);
 const ra=await p.evaluate(()=>{const q=wbk3Internals.load();return {cur:StudentStore.currentId(),stars:q.stars,h6:!!q.starred.w06,h9:!!q.starred.w09,l2:localStorage.getItem('taha_wbk2_progress_v1')}});
 ok(ra.cur===r.a&&ra.stars===1&&ra.h6&&!ra.h9,'student A keeps own stars, not B\'s');
 ok(ra.l2&&ra.l2.indexOf('L2-A')>0,'lesson-2 key unchanged by lesson 3');
 ok(errs.length===0,'no errors (iso)',errs.join());
 // ---- persistence across reload ----
 await p.reload();await p.waitForTimeout(1200);
 const q=await p.evaluate(()=>wbk3Internals.load());ok(q.stars===1&&q.starred.w06,'progress survives reload');
 await br.close();
 // ---- offline ----
 ({br,p,errs}=await L.mk('board',{sw:true}));
 await p.goto('http://127.0.0.1:8971/index.html');await p.waitForTimeout(3500);
 await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(3500);
 const c=await p.evaluate(async()=>{const o={};for(const k of await caches.keys()){const c=await caches.open(k);o[k]=(await c.keys()).map(x=>x.url.replace(location.origin,''))}return o});
 const k=Object.keys(c);ok(k.length===1&&k[0]==='taha-app-v43','only v43 cache',k.join());
 const u=c['taha-app-v43']||[];
 ['/wbk3.js','/wbk3-data.js','/wbk3.css','/wbk2.js','/wbk2-data.js'].forEach(f=>ok(u.includes(f),'cached '+f));
 const w3=u.filter(x=>/words\/wbk3_/.test(x));ok(w3.length===12,'12 new word recordings cached',String(w3.length));
 const allW=await p.evaluate(()=>WBK3_DATA.approvedAudioFiles().map(x=>'/'+x));
 ok(allW.length===25&&allW.every(f=>u.includes(f)),'all 25 approved word recordings cached');
 const syl=u.filter(x=>x.includes('/syllables/'));ok(syl.length===21,'21 lesson-2 syllables still cached',String(syl.length));
 ok(!syl.some(x=>/wbk2_01|wbk2_21|wbk2_23/.test(x)),'rejected syllables not cached');
 execSync('fuser -k 8971/tcp || true');await p.waitForTimeout(800);
 let loaded=true;try{await p.reload({timeout:15000});await p.waitForTimeout(3000)}catch(e){loaded=false}
 ok(loaded,'offline reload');
 await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(200);
 ok(await p.evaluate(()=>document.getElementById('wbk3Entry').offsetParent!==null),'entry visible offline');
 await p.click('#wbk3Entry');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.getElementById('wbkL3').classList.contains('active')),'lesson 3 opens offline');
 await p.evaluate(()=>{window.__au=[];const OA=window.Audio;window.Audio=function(s){const a=new OA(s);const r={src:String(s),ok:null};a.addEventListener('playing',()=>r.ok=true);a.addEventListener('error',()=>r.ok=false);window.__au.push(r);return a}});
 await p.evaluate(()=>{wbk3State.scope='all'});
 const all=await p.evaluate(()=>WBK3_DATA.WORDS.map(w=>w.audio));
 const res=await p.evaluate(async(list)=>{const out=[];for(const f of list){const r=await fetch(f);out.push(r.ok&&(await r.arrayBuffer()).byteLength>2000)}return out},all);
 ok(res.every(Boolean),'all 25 word files fetch offline from cache',res.filter(x=>!x).length+' failed');
 await p.evaluate(()=>wbk3Internals.renderHome());await p.click('[data-stage=hear]');await p.waitForTimeout(800);
 const it=await p.evaluate(()=>{const R=wbk3State.run;return R.items[R.i]});await p.click(`#wb3Opts [data-id=${it.id}]`);await p.waitForTimeout(500);
 const st=await p.evaluate(()=>wbk3Internals.load());ok(st.syl[it.id].f===1,'activity works offline and saves');
 ok(errs.filter(e=>!/net::|Failed to load|ERR_/.test(e)).length===0,'no JS errors offline',errs.join(' | '));
 console.log('PASS',pass,'FAIL',fail);await br.close();
})();
