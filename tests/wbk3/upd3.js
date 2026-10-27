const L=require('./lib.js');const {execSync,spawn}=require('child_process');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const PORT=8975;
(async()=>{
 execSync(`fuser -k ${PORT}/tcp || true`);
 let sv=spawn('python3',['-m','http.server',PORT,'--bind','127.0.0.1'],{cwd:'/tmp/v3/old',stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
 const {br,p,errs}=await L.mk('board',{sw:true});
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(3500);
 await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(3000);
 let ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v41','previous production version v41 installed',ks.join());
 ok(await p.evaluate(()=>!document.getElementById('wbk3Entry')&&!!document.getElementById('wbk2Entry')),'old has lessons 1-2 only');
 // seed: lesson 1, lesson 2 (real internals), app stars, plus a second student with own data
 const seed=await p.evaluate(()=>{
  localStorage.setItem('taha_wbk_progress_v1',JSON.stringify({v:1,l1:{stars:7,items:{},sessions:2},prefs:{}}));
  localStorage.setItem('taha_app_stars','12');
  const I=wbk2Internals;const q=I.load();I.logResult&&I.logResult(q,'s02','hear','f',{});I.logResult&&I.logResult(q,'s02','build','f',{});I.save(q);
  const a=StudentStore.currentId();const b=StudentStore.add('طالب ثانٍ');return {a,b}});
 await p.evaluate(b=>StudentStore.switchTo(b),seed.b);await p.waitForTimeout(1800);
 await p.evaluate(()=>{localStorage.setItem('taha_app_stars','3');const I=wbk2Internals;const q=I.load();I.logResult(q,'s03','hear','f',{});I.save(q)});
 await p.evaluate(a=>StudentStore.switchTo(a),seed.a);await p.waitForTimeout(1800);
 const snap=()=>p.evaluate(()=>{const f=document.createElement('iframe');document.body.appendChild(f);const rl=f.contentWindow.localStorage;const o={};for(let i=0;i<rl.length;i++){const k=rl.key(i);if(/^taha_(s_|students|current)/.test(k))o[k]=rl.getItem(k)}f.remove();return o});
 const before=await snap();ok(Object.keys(before).length>5,'seeded 2 students ('+Object.keys(before).length+' keys)');
 // swap server to the NEW version on the same origin
 execSync(`fuser -k ${PORT}/tcp || true`);await p.waitForTimeout(600);
 sv=spawn('python3',['-m','http.server',PORT,'--bind','127.0.0.1'],{cwd:process.cwd(),stdio:'ignore'});await p.waitForTimeout(1200);
 await p.reload();await p.waitForTimeout(4500);await p.reload();await p.waitForTimeout(4500);
 ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v46','updated: old v41 cache removed, only v46',ks.join());
 ok(await p.evaluate(()=>!!document.getElementById('wbk3Entry')&&!!document.getElementById('wbk2Entry')),'lesson 3 entry present after update');
 const after=await snap();
 ok(Object.keys(before).filter(k=>/app_stars/.test(k)).every(k=>before[k]===after[k]),'each student app-stars value identical before/after');
 const lost=Object.keys(before).filter(k=>after[k]!==before[k]);
 ok(lost.length===0,'no student data changed or lost across the update ('+Object.keys(before).length+' keys compared)',lost.join());
 const newKeys=Object.keys(after).filter(k=>!(k in before));ok(newKeys.every(k=>/wbk3|taha_current|students/.test(k)),'only lesson-3-related keys added',newKeys.join());
 // lesson 3 opens fresh, lessons 2 and 1 still work with preserved data
 await p.evaluate(()=>{showScreen('words')});await p.click('#wbk3Entry');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.getElementById('wbkL3').classList.contains('active')&&wbk3Internals.load().stars===0),'lesson 3 opens, starts clean');
 await p.evaluate(()=>{showScreen('words')});await p.click('#wbk2Entry');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.getElementById('wbkL2').classList.contains('active')&&wbk2Internals.load().syl.s02&&wbk2Internals.load().syl.s02.ev.length===2),'lesson 2 opens with its saved progress intact');
 await p.evaluate(()=>{showScreen('words')});await p.click('#wbkEntry');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.getElementById('wbkL1').classList.contains('active')&&JSON.parse(localStorage.getItem('taha_wbk_progress_v1')).l1.stars===7),'lesson 1 opens, 7 stars intact');
  ok(errs.length===0,'no JS errors',errs.join(' | '));
 console.log('PASS',pass,'FAIL',fail);sv.kill();await br.close();execSync(`fuser -k ${PORT}/tcp || true`);
})();
