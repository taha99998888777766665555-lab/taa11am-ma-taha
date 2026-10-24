const L=require('/tmp/v61/t/lib.js');const fs=require('fs');const {execSync,spawn}=require('child_process');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
(async()=>{
 const {br,p,errs}=await L.mk('board',{sw:true});
 await p.goto('http://127.0.0.1:8963/index.html');await p.waitForTimeout(3500);
 await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(3000);
 let ks=await p.evaluate(()=>caches.keys()); ok(ks.join()==='taha-app-v39','old v39 installed',ks.join());
 ok(await p.evaluate(()=>!document.getElementById('wbk2Entry')),'old has no lesson 2');
 // seed lesson1 data + a student
 await p.evaluate(()=>{localStorage.setItem('taha_wbk_progress_v1',JSON.stringify({v:1,l1:{stars:7,items:{},sessions:2},prefs:{}}));localStorage.setItem('taha_app_stars','12')});
 const before=await p.evaluate(()=>[localStorage.getItem('taha_wbk_progress_v1'),localStorage.getItem('taha_app_stars'),StudentStore.currentId()]);
 execSync('fuser -k 8963/tcp || true');await p.waitForTimeout(500);
 const sv=spawn('python3',['-m','http.server','8963','--bind','127.0.0.1'],{cwd:'/home/claude/wt-words-l2',stdio:'ignore'});await p.waitForTimeout(1200);
 await p.reload();await p.waitForTimeout(4000);await p.reload();await p.waitForTimeout(4000);
 ks=await p.evaluate(()=>caches.keys()); ok(ks.join()==='taha-app-v40','updated to v40 only',ks.join());
 ok(await p.evaluate(()=>!!document.getElementById('wbk2Entry')),'new entry present after update');
 const after=await p.evaluate(()=>[localStorage.getItem('taha_wbk_progress_v1'),localStorage.getItem('taha_app_stars'),StudentStore.currentId()]);
 ok(JSON.stringify(before)===JSON.stringify(after),'lesson1/app/student data preserved');
 await p.evaluate(()=>{showScreen('words')});await p.click('#wbk2Entry');await p.waitForTimeout(500);
 ok(await p.$$eval('#wb2Grid .wb2-cell',c=>c.length)===25,'lesson 2 runs after update');
 // lesson 1 still opens and works
 await p.evaluate(()=>{showScreen('words')});await p.click('#wbkEntry');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.getElementById('wbkL1').classList.contains('active')&&document.querySelectorAll('#wbkL1 .wbk-card, #wbkL1 .wbk-dot').length>0),'lesson 1 opens');
 console.log('errs',errs);ok(errs.length===0,'no js errors');console.log('PASS',pass,'FAIL',fail);
 sv.kill();await br.close();
})();
